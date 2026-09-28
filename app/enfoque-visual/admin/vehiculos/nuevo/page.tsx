import {redirect} from "next/navigation";
import {getAdminSession} from "@/lib/enfoque-admin";
import {VehicleForm} from "@/components/enfoque/admin/VehicleForm";
export const dynamic="force-dynamic";
export default async function NewVehicle(){if(!await getAdminSession())redirect("/enfoque-visual/admin/login");return <VehicleForm/>;}
