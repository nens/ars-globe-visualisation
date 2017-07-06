import storybook from "@kadira/storybook/dist/server/middleware";
import express from "express";
import request from "request";

const port = 9001;

const app = new express();

app.use(storybook("./.storybook"));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});


app.use("/api", (req, res) => {
  const url = "http://localhost:5000/api" + req.url;
  const headers = {
    username: process.env.sso_user,
    password: process.env.sso_pass
  };
  req
    .pipe(
      request({
        url,
        headers
      })
    )
    .pipe(res);
});

app.listen(port, error => {
  if (error) {
    console.error(error);
  } else {
    console.info(
      "==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.",
      port,
      port
    );
  }
});
