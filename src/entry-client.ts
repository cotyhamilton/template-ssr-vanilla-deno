import "./style.css";
import "./typescript.svg";
import { setupCounter } from "./counter.ts";

setupCounter(document.querySelector("#counter") as HTMLButtonElement);
