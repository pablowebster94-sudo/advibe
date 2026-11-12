import { redirect } from "next/navigation";

/** The creative studio is the product's home screen; the creations archive stays at /products. */
export default function Home() {
  redirect("/new");
}
