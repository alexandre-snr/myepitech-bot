package main

import (
	"bytes"
	"context"
	"database/sql"
	"errors"
	"log"
	"os"
	"scheduler/models"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/jasonlvhit/gocron"
	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
	"github.com/xo/dburl"
)

func main() {
	log.Println("starting scheduler.")

	task()
	if os.Getenv("ENV") == "production" {
		gocron.Every(5).Minutes().Do(task)
		<-gocron.Start()
	}
}

func task() {
	log.Println("starting task.")
	if err := triggerAll(); err != nil {
		log.Println(err)
	}
}

func triggerAll() error {
	db, err := dburl.Open(getDbURL())
	if err != nil {
		return err
	}
	defer db.Close()

	cli, err := client.NewClientWithOpts(client.FromEnv,
		client.WithAPIVersionNegotiation())
	if err != nil {
		panic(err)
	}
	defer cli.Close()

	reg, err := models.Registrations(db)
	if err != nil {
		return err
	}

	for _, r := range reg {
		if err = triggerOne(db, cli, r); err != nil {
			log.Println(err)
			dbErr := models.Error{
				Email:   r.Email,
				Created: time.Now(),
				Error:   strings.ToValidUTF8(err.Error(), ""),
			}
			err = dbErr.Save(db)
			if err != nil {
				log.Println(err)
			}
		}
	}
	return nil
}

func triggerOne(db *sql.DB, cli *client.Client, reg *models.Registration) error {
	log.Println("starting container for", reg.Email)

	resp, err := cli.ContainerCreate(context.Background(), &container.Config{
		Image: os.Getenv("SCRAP_IMAGE"),
		Cmd: []string{
			"node",
			".",
			reg.Email,
			decipher(reg.Password),
			decipher(reg.Twofactor),
			reg.Lastcheck.Format(time.RFC3339),
			strconv.FormatInt(reg.Chatid, 10),
		},
		Tty: false,
		Env: os.Environ(),
	}, nil, nil, nil, "")
	if err != nil {
		return err
	}

	net := os.Getenv("SCRAP_NETWORK")
	if net != "" {
		err = cli.NetworkConnect(context.Background(), net, resp.ID, nil)
		if err != nil {
			return err
		}
	}

	if err := cli.ContainerStart(
		context.Background(), resp.ID,
		types.ContainerStartOptions{}); err != nil {
		return err
	}

	statusCh, errCh := cli.ContainerWait(context.Background(), resp.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:
		if err != nil {
			return err
		}
	case <-statusCh:
	}

	infos, err := cli.ContainerInspect(context.Background(), resp.ID)
	if err != nil {
		return err
	}

	if infos.State.ExitCode != 255 {
		out, err := cli.ContainerLogs(context.Background(), resp.ID, types.ContainerLogsOptions{ShowStderr: true})
		if err != nil {
			return err
		}
		defer out.Close()

		stdoutput := new(bytes.Buffer)
		stderror := new(bytes.Buffer)
		stdcopy.StdCopy(stdoutput, stderror, out)

		cli.ContainerRemove(context.Background(), resp.ID, types.ContainerRemoveOptions{})
		return errors.New(stderror.String())
	}

	cli.ContainerRemove(context.Background(), resp.ID, types.ContainerRemoveOptions{})

	reg.Lastcheck = time.Now()
	return reg.Update(db)
}
