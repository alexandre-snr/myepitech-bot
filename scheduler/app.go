package main

import (
	"context"
	"log"
	"os"
	"scheduler/models"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/jasonlvhit/gocron"
	_ "github.com/joho/godotenv/autoload"
	_ "github.com/lib/pq"
	"github.com/xo/dburl"
)

func main() {
	log.Println("starting scheduler.")

	if os.Getenv("ENV") == "production" {
		gocron.Every(5).Minutes().Do(task)
		<-gocron.Start()
	} else {
		task()
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
		if err = triggerOne(cli, r); err != nil {
			log.Println(err)
		}
	}
	return nil
}

func triggerOne(cli *client.Client, reg *models.Registration) error {
	log.Println("starting container for", reg.Email)

	resp, err := cli.ContainerCreate(context.Background(), &container.Config{
		Image: os.Getenv("SCRAP_IMAGE"),
		Cmd: []string{
			os.Getenv("SCRAP_COMMAND"),
			reg.Email,
			reg.Password,
			reg.Twofactor,
		},
		Tty: false,
	}, nil, nil, nil, "")
	if err != nil {
		return err
	}

	if err := cli.ContainerStart(
		context.Background(), resp.ID,
		types.ContainerStartOptions{}); err != nil {
		return err
	}

	return nil
}
