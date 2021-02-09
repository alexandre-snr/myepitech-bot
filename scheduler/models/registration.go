package models

// Registrations retrieves all rows from 'public.registrations' as Registrations.
func Registrations(db XODB) ([]*Registration, error) {
	var err error

	// sql query
	const sqlstr = `SELECT ` +
		`id, email, password, twofactor, lastcheck, chatid ` +
		`FROM public.registrations`

	// run query
	XOLog(sqlstr)
	q, err := db.Query(sqlstr)
	if err != nil {
		return nil, err
	}
	defer q.Close()

	// load results
	res := []*Registration{}
	for q.Next() {
		r := Registration{_exists: true}

		// scan
		err = q.Scan(&r.ID, &r.Email, &r.Password, &r.Twofactor, &r.Lastcheck, &r.Chatid)
		if err != nil {
			return nil, err
		}

		res = append(res, &r)
	}

	return res, nil
}
