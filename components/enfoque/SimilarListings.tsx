import type {Property,Vehicle} from "@/lib/enfoque-data";
import {norm} from "@/lib/enfoque-filters";
import {PropertyCard,VehicleCard} from "./Cards";
import {BuscoCta} from "./BuscoCta";

// "Otras propiedades": hasta 3 similares + CTA a "Busco propiedad" con los datos de la ficha.
export function SimilarProperties({items,current}:{items:Property[];current:Property}){
  return <section className="border-t border-black/10 py-12" aria-labelledby="similares">
    {items.length>0&&<><h2 id="similares" className="ev-display text-4xl font-black">Otras propiedades</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-3">{items.map(x=><PropertyCard key={x.id} x={x}/>)}</div></>}
    <BuscoCta prefill={{tipo:norm(current.type),canton:norm(current.city),operacion:current.operation}}/>
  </section>;
}

export function SimilarVehicles({items,current}:{items:Vehicle[];current:Vehicle}){
  return <section className="border-t border-black/10 py-12" aria-labelledby="similares">
    {items.length>0&&<><h2 id="similares" className="ev-display text-4xl font-black">Otros vehículos</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-3">{items.map(x=><VehicleCard key={x.id} x={x}/>)}</div></>}
    <BuscoCta prefill={{tipo:"vehiculo",canton:current.city?norm(current.city):undefined}}/>
  </section>;
}
