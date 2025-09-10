import express from "express";
import 'dotenv/config';
import cors from 'cors'
import tarjetaRouter from "./routers/tarjetaRouter.js"

const app = express();

app.use(express.json());
app.use(cors({
      origin: "https://www.devcorebits.com"
}
))
app.use(express.urlencoded({ extended: true }));


app.use("/tarjetas", tarjetaRouter);
app.use("/health", (req, res) => res.send("OK"));

const PORT = 3005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
