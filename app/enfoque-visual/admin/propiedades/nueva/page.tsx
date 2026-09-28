import {redirect} from "next/navigation";
import {getAdminSession} from "@/lib/enfoque-admin";
import {AdminNav} from "@/components/enfoque/admin/AdminNav";import {PropertyForm} from "@/components/enfoque/admin/PropertyForm";
export const dynamic="force-dynamic";
export default async function NewProperty(){if(!await getAdminSession())redirect("/enfoque-visual/admin/login");return <><AdminNav active="/enfoque-visual/admin/propiedades"/><PropertyForm/></>;}
