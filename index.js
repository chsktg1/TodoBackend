const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
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

const mWareFunc = (req, res, next) => {
  const authToken = req.headers["authorization"];
  if (authToken === undefined) {
    res.status(401);
    res.send("Invalid JWT Token");
  } else {
    let token = authToken.split(" ")[1];
    if (token === undefined) {
      res.status(401);
      res.send("Invalid JWT Token");
    } else {
      jwt.verify(token, "secret", async (error, payload) => {
        if (error) {
          res.status(401);
          res.send("Invalid JWT Token");
        } else {
          req.actualUserName = payload.username;
          next();
        }
      });
    }
  }
};

app.get("/", mWareFunc, async (req, res) => {
  //   res.send("hellos");
  const result = await db.all(
    `select * from todos where status=='progress' and user="${req.actualUserName}"`
  );
  res.send(JSON.stringify(result));
  res.status(200);
});

app.get("/completed", mWareFunc, async (req, res) => {
  const result = await db.all(
    `select * from todos where status=='completed' and user="${req.actualUserName}"`
  );
  console.log("completed", result);
  res.send(JSON.stringify(result));
  res.status(200);
});

app.post("/add", mWareFunc, async (req, res) => {
  //   console.log("req", req);
  console.log("body", req.body);
  const { todo, status, date_added, completion } = req.body;
  const result = await db.run(
    `insert into todos (pk,todo,status,date_added,completion,user) values ("${uuidv4()}","${todo}","${status}","${date_added}","${completion}","${
      req.actualUserName
    }")`
  );
  console.log(result);
  res.send("added successfully");
  res.status(200);
});

app.delete("/delete/:id", mWareFunc, async (req, res) => {
  const { id } = req.params;
  const result = await db.run(`delete from todos where pk like ${id}`);
  res.send("delete");
  res.status(200);
});

app.put("/update/status", mWareFunc, async (req, res) => {
  const { pk, toUpdate } = req.body;
  const sql_str = `update todos set status="${toUpdate}" where pk="${pk}"`;
  console.log("in here", sql_str);
  const result = db.run(sql_str);
  res.send("updated");
  res.status(200);
});

app.put("/update/todo", mWareFunc, async (req, res) => {
  const { todoData, pk } = req.body;
  const sql_str = `update todos set todo="${todoData}" where pk="${pk}"`;
  console.log("in here", sql_str);
  const result = db.run(sql_str);
  res.send("updated");
  res.status(200);
});

app.delete("/delete", mWareFunc, async (req, res) => {
  const { pk } = req.body;
  const sql_str = `delete from todos where pk="${pk}"`;
  const result = db.run(sql_str);
  res.send("deleted");
  res.status(200);
});

app.post("/login", async (req, response) => {
  console.log(req.body);
  const { username, password } = req.body;
  console.log(username, password);
  const sql_str = `select * from users where username="${username}"`;
  const res = await db.all(sql_str);
  if (res.length == 1) {
    if (res[0]["password"] == password) {
      const payload = { username };
      const jwtToken = jwt.sign(payload, "secret");
      response.send({ msg: jwtToken });
      response.status(200);
    } else {
      response.send({ msg: "Authentication Failed" });
      response.status(400);
    }
  } else {
    response.send({ msg: "User doesn't exist" });
    response.status(404);
  }
});

app.post("/signup", async (req, response) => {
  const { name, username, password } = req.body;
  const sql_str = `select * from users where username="${username}"`;
  const res = await db.all(sql_str);
  if (res.length != 0) {
    response.status(400);
    response.send("username already exists");
  } else {
    const sql_query_to_add_user = `insert into users (name,username,password) values ("${name}","${username}","${password}")`;
    const result = db.run(sql_query_to_add_user);
    response.send("Account created Successfully");
    response.status(200);
  }
});
