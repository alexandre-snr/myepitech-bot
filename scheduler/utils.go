package main

import "os"

// getDbURL builds a pgsql connection url using environment variables
func getDbURL() string {
	url := "pgsql://"
	url += os.Getenv("DB_USER") + ":"
	url += os.Getenv("DB_PASSWORD") + "@"
	url += os.Getenv("DB_HOST") + "/"
	url += os.Getenv("DB_NAME")
	if os.Getenv("DB_SSL") == "disable" {
		url += "?sslmode=disable"
	}
	return url
}
