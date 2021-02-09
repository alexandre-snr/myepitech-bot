package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"scheduler/models"
	"strconv"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
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

	cli, err := client.NewClientWithOpts(client.FromEnv,
		client.WithAPIVersionNegotiation())
	if err != nil {
		panic(err)
	}

	reg, err := models.Registrations(db)
	if err != nil {
		return err
	}

	for _, r := range reg {
		if err = triggerOne(db, cli, r); err != nil {
			log.Println(err)
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
			reg.Password,
			reg.Twofactor,
			reg.Lastcheck.Format(time.RFC3339),
			strconv.FormatInt(reg.Chatid, 10),
		},
		Tty: false,
		Env: os.Environ(),
	}, nil, &network.NetworkingConfig{}, nil, "")
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

	reg.Lastcheck = time.Now()
	return reg.Update(db)
}
