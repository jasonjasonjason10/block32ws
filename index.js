require("dotenv").config();
const pg = require("pg");
const express = require("express");
const client = new pg.Client(process.env.DAtABASE_URL);
const app = express();

app.use(require("morgan")("dev"));
app.use(express.json());

//GET all flavors (returns an array of all the flavors)
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        SELECT * from flavors ORDER BY created_at DESC
        `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//GET a single flavor (by ID, and id=$1 doesnt mean id of 1 (study this more later))
app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        SELECT * FROM flavors where id = $1
        `;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//CREATE a new flavor (post)
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        INSERT INTO flavors(name, is_favorite)
        VALUES($1, $2)
        RETURNING *
        `;
    const response = await client.query(SQL, [req.body.name, req.body.is_favorite]);
    res.status(201).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//UPDATE a flavor (put)
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
        UPDATE flavors
        SET name = $1,
            is_favorite = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
    const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//DELETE a flavor
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
    DELETE FROM flavors WHERE id = $1
    `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

//DATABASE set up and server start
const init = async () => {
  await client.connect();
  console.log("connected to data base");

  let SQL = /* sql */ `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors (
        id SERIAL PRIMARY KEy,
        name TEXT NOT NULL,
        is_favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );
  `;
  await client.query(SQL);
  console.log("tables created");

  SQL = /* sql */ `
    INSERT INTO flavors(name, is_favorite) VALUES
    ('Vanilla', false),
    ('Chocolate', false),
    ('Strawberry', false),
    ('Half Baked', false),
    ('Cookies and Cream', false),
    ('Mint ChocChip', true);
  `;

  await client.query(SQL);

  const port = process.env.PORT;
  app.listen(port, () => console.log(`Listening on port ${port}`));
};

init();
