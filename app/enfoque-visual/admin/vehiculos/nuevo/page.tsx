import {redirect} from "next/navigation";
import {getAdminSession} from "@/lib/enfoque-admin";
import {AdminNav} from "@/components/enfoque/admin/AdminNav";import {VehicleForm} from "@/components/enfoque/admin/VehicleForm";
export const dynamic="force-dynamic";
export default async function NewVehicle(){if(!await getAdminSession())redirect("/enfoque-visual/admin/login");return <><AdminNav active="/enfoque-visual/admin/vehiculos"/><VehicleForm/></>;}
