const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    method: ["GET", "POST", "PUT", "DELETE"],
  })
);
let db;
const initialiseDBandServer = async () => {
  try {
    db = await open({
      filename:
        "/Users/sumanthkumar/Desktop/allBackEndProjects/Todos/todo_storage.db",
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("server started");
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

initialiseDBandServer();

app.get("/", async (req, res) => {
  //   res.send("hellos");
  const result = await db.all("select * from todos where status=='progress'");
  res.send(JSON.stringify(result));
  res.status(200);
});

app.get("/completed", async (req, res) => {
  const result = await db.all("select * from todos where status=='completed'");
  console.log("completed", result);
  res.send(JSON.stringify(result));
  res.status(200);
});

app.post("/add", async (req, res) => {
  //   console.log("req", req);
  console.log("body", req.body);
  const { todo, status, date_added, completion } = req.body;
  const result = await db.run(
    `insert into todos (pk,todo,status,date_added,completion) values ("${uuidv4()}","${todo}","${status}","${date_added}","${completion}")`
  );
  console.log(result);
  res.send("added successfully");
  res.status(200);
});

app.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  const result = await db.run(`delete from todos where pk like ${id}`);
  res.send("delete");
  res.status(200);
});

app.put("/update", async (req, res) => {
  const { pk, toUpdate } = req.body;
  const sql_str = `update todos set status="${toUpdate}" where pk="${pk}"`;
  console.log("in here", sql_str);
  const result = db.run(sql_str);
  res.send("updated");
  res.status(200);
});
