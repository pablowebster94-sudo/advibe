"use client";

import { motion } from "framer-motion";

const GOAT_IMAGE = "data:image/webp;base64,UklGRv7cAABXRUJQVlA4IPLcAABwnwOdASowAvgCPikSh0KhoQlsnv4MAUJaW78fCaKY7fZf4msDmJjwH8A294jKvX7J787iua/tOef2P8FyldwPoXlPdr+av/x/tB8OefR6z/+76Vf+d6F3Q7+lZ67PpAWRb68/2X5Ke7HxV/S/3j9xPOf8g+afwX9Z/b7+8/JR8z/5f81/z//W/rftm6V/6/9v/2H/b/qfwv/QPs9+r/lv+i/4n9c/dz7j/s3/Z/lX+j/9X9R9t/mJ89/kV8o/qb/bfyT9zv6j+6v3u+j/+f+Wf77/ufyr2oOt/0P7H+0l9a/LP+N/If3b/qHwBev/8v+W/7f/pf1b///+32K/sn8FH9T/jP+m/jn7hf1z//f9v8R/pX/S/kP+p/7vvYeP/8r/D+qj/h/yH/cf/T+z/T1+nf+n+R/7T/5/2H/////67fRP/V/v35KfaV+iv/M/i370f1T///+P7Nv/7/Cf+l7VXoa/oX/9DbOEpFp/GCPbbqSAprAI2IKrn5Oja0rOLNfhtAwcBMgmCDIJfTXZlQI4NUb4YJ94tU0hZ7dD//Vvp7Pj6K0YgpdQ13OYMx9uFSDOZYhpLl04sleFyDxUQPv00dNraVpfnoPyp2c8vsk//VLcgGZZ2NxH/pKd2MTWIXE6G2EaRRRevk6s9e+sW9XSemsuS80PyMuGp6J+vEIpTNHWFXE403V8kmkUu/xJwe+O1S+90pStjqS7D69K3DNXesgiyzgOestaSsxefeJebEzrxGK3qEMfS79Zlv7ZSyRKJjjN9NHuG3ntyw+qBprrvVK4X1wSN7RjH9QDw5SCvePwUnO8HFeSFRbVHGOYRxlvhfor4FdALywvriXk5ZIfC75t6Yvvky1VT1H/C9+NdI5VuxoatxaMVj76Kns7HwoUAGhNhq/C+rFjIGzPLT2XcoTja2xgkcge5uDQqcWD6dpzA8L44F3qAvHcSDEhch3YaNbfVRaHCp4VOQiwCUKly++zQPCd/zSAsap7US7uuQb9KKTl5/U5joFUFDHexrW74kW7C+VD13Dmv2PabEz976ccAqNMjftd413Cn038+zRYN9OcYa6kUGdc6N4qmlyHyai0Eoexo/xPGmhJdiwzqBqe7Mi6poIIQur/UpZQGn1rr9kzdZ4P7Kn5vg0HT5Zh2LAjLSaNQfgopHgI7S+TxYtL+gKBvMBIZOSTMLyd+tqYHWT+OXzAAfGr0edjJsNO7QSJfSRygRE+vuHUVCUydpgPCjXCD5bqG4uvYpZbyTTxx7bi00pVXU5hOjlOkoxysJTtm8g9Tupk3uQPMPzCtfZ9SZf+h8mGuRnRe9w7NByTAWTPSr25LiKE7ruuAoy1514/40AuCzV7Ny13/6dA6Ydm3k2bs1CAAvmxO5xtL0o0C72aTyGFeCAtUvwyVS1ETG7tpDCxYzbDCXJTN84pt/kxRpi0fXjnU4FlxoVl4Iy06q9oYOduQSlxnJyQrRynP22aSYP8Oe2GOOVLWA4Etcfs7rS/q05tfDX5lwYA+3Eub7gRIEfDV3b4KcIbkGEWV6kRcAWw7dhxzc0fttEWy4B6xkBramsofV2qByDl9RSVr0dR5M4vtKc7qXdjlMjvGZYPr2pRX/i1I+zorur9PJHw2LGhecMlr1metIdLIKrJRp4RutRVWsZCfCR+zLm7///lFy50aBWeHjyo5gBrwGx8c+QPp/kUq6xXdppEnmRULuqCYXvra4bmNYFZ6FP8j3Ye6wPCxbK2o3Rl0+edTYODvEr/SYFLjtSOmGpPdErQwD2qdD4u3YMYIZlGHLc+kv5EkRnG4VygOQgEDSLAeL4fJVCPgWdTryNI6x30PpTfxplPJNPRMsDiymkKp7E1l2c26m3k+vatP/Mw7dOuQyqDMbb5z3mFlH/o1pRNvqLtPpNE94yoIly12vRTCdHJMhGIu7swfcT+XoP343hsw5JzuUyZ1Gj7Q8xELU89hy9O1I2KTDorpZ51tnYtTjUjIrB+zj6EcyLlj1rdpvwwr+h9AhDsKQkruh/gHB0Y7KDiNejJ3Fg8oR4xMxVB8CQMAdzSm5BFgixC4/mrSM5BOSHtkDf2647NIlh1k7BdFjz7dMa/pg1+E9AoXRJV0wEVcmrhr9LL7HB+n2kq/s/mml26IvoFIZ44C1MTYth+ztZWQ6cVFXijhfDnkr4SGHTZJPtd3opV2badBL9/sA6jHycXHufU/V4EcvblgARqBBz32I6nk/FjyuCHnPJlaw8c2RQzt9rLDLYVrDY8efgDG3Gb2q5TbnfE67cV//6NjR+IMqNeBqLPfkRgASfpW3noHRHFydKFp5IEeP5GrDhYbcXqx9WO+UMaO0yTOdKptMweld9hLADBatS2JO4xeljOz3ENnLSWApdnD6x4AFQFI2LbUPOZ33dlQ+7vuZI2Xdx2F3Mh7jQi7SyR0tGckPArXNa+dsGkeEFEO2grCHFhSv85qpnvkat8GCaWicRHZaLNALo+hSm63atQNFWvSwRWTC4NTX7tsRdzctw/cu2WhvZ3lAQIpA7S4ZX4BLZodBgbjLE4b3aJ9o969+7dSKyjMh/VDdv/92NNmen0rg5t2XXI3N0Rdo037Bx25QpExkKdaUDmFa4Lf/QWJk97+15a7POonLAU+xa0cNmkgSf9+EALmYyxzmtB4f5db0D1qAc2tNFspj+F+bikTuooiFlxe2TguW2vrhNt564XrWtL5BWUkFphytWv1AA+t1oCPTdVKSsNfX9DTd+C/N99fJvA0bKn3MvauGSkAeKoRwfBDukp0kObGkqUH2Fz7ZHCo04tlJAPtSqByFmwHEzRsppGlG7U8Yw479fZh5R2PcJWpt5Xf451Ux0ewfXZhvu4dx0CapvR14bHMyCpa0rsTKy9dF5I4JBB9cIVlbrpXoVesv1BX6Bm8ovfxuKG9LvvXz/aiuswM3b2USfjmqGoFSraKycseVUYn3mO7HvvtFsCo20RTUlEkiVdOu5z7tzyxCw+n3V3uLw1W0XSuQhwQCznSw+Sq4htncNPwhQvH2dvnBWErxg+4zUeJzazttdfCx1oVKVEn8nDsm8Ns0TPZbv6Z40cVR1MNzynDfy3ZtLA3P7TWPUsHN7UTLKAgRDOyrGVSE6Yt+cH1yxwiO7USHIGpDAqD80AbpxbTgv5csg1U4gpWh616vhoIfI5D5Ub2x0xZ8cgTfiikYHMaSZDy7hb545XgFItFuvol+nDlzz/hG/3q7Z49+PJqc+uDrE6Ek88OzGt2zBwGUA84R+KBnhD7WP4Vpe53WvGpU9wmPfE9FJ1Dsxb3lTPztBgFI/w7Nc4MV6jJUr5feExPXdMFK8kr6HB7DzLp8Z11upa2bSBEBuzot7yuoNkJxPOuX58z9x9OSbNgWkPYKmHEcWmcqELuh8l7DzosURgiNgHuOqVp1jWltJqftHm12juqCV/PTrV3Mb5hUGlfbhIEF66oZXVO9bk0yuHpOtvjiBJ9dPODv87E8Z7/xRrQTx5Ks1fef+pGNUdJ49x/QVJQgn3o0oUDgMEH/8RgaXBkxLvj9g/YJ+uEKl8kQO95FvMKfs5I3C69Vnz6LrLepzPA8pn8wRQ8urgDrnyEurG4mrdAdJdUCaWN4DI36yZ0wLkleVKUI7tu3BgXicoF6X+96MxKEPRUGl2FyZK7v63ol5pTaXfczwGO+MrYCYesz2VTxx/konQAG2Q0VQLdUucfLmL5wyliVNjJ6gvALL/w4rTbh4u5bxiRWnfNSwnMCuo6NpW1uzFbRQH5nF6N5u9eWSfnGRTckgldIwizYE8IT86/oEKmJEI+s+Rhm2P6WeWwkt9k7dcYTXgM3wmSaYjLURg9Od5AkZlwRNPJAX6gjf95NG13roUZfL/n8uZBaqFL76iwt4//+cUQrdy/2OWkm2ZVD9jWAzUypWliPOOuN4eh2IcKhRd+uQeWvjwhzw30QCR5MVLU+oKg07dxMw/BzpY7dIYs5bNuy6PR0492B2XQOZd8CI1boP+JPUmTwDnQo7m626PoC2+gwaWkwCwef4Y1YnATO5k8XCVzJX23iRjTSE3xNnL+nBkDYOMz7rjF/Gm9bLmNJ18lYJkvnWBBTCIn1sNsOPC6fyGiWImp5HMnUK+qE4rtpHIJoHZnPefNUrM6qgA6b3FlPxt1oDvrbyZ5q0tyk+gUw44cBUyYePS+Nb5J0dagH1WoB9aVCRl3lNCsp3RsX9Ey4e1Nz2wp4QhzdrUY0wyFspjKkW8qd6DcVqx95d0prknfiTehblIHA9zKDP5yBHtuSOI88a2EC9ZwM/DuTW09GnyfZ5VepmgCYTTiUdXJ9Sp55QxCIb9Kl3H0lb0yC+/Bg0rd3uvy0ukuvmb8r1WH3xO6ZzpdGUWPsZyWvfT51WPYv6URLxJ6Wxnd9RAD9OoqFa5E4ICcAaqjw83Av7OxF0ZULdmADPTsxgzOX+e/Pv5rHLKD7oh1ncScaJ2BZSe+Q4K4N7vAp6hcA3/LI5WIgcPjflHaMsSbqHO1on4L7uvljopKyKw+jjoaZP7yfa5q47rKhA27bLzfehlB0dSMkZPQ3sqqrUoresfSNX3XXRsYzaPsKW1btk1w6IV5n2rYJrp1ydSBp589ga61wOyqtZ1R8Zw1aMO1Yji17oK3Q8WkGZnUwg1lTIStviMyEZ7Tj7YMnMcAETXU1r9oB9A0y/DwTYHZWv2RSGiP+ekl//rwk/uJoi6/73V9BiWeOy+9TlOTKJKs/UhC++edi9rkB2qvOcOwKPgLdiY8P2MwcbPWsIddhwyD/Cb6Nkbgg1P7wlPCO4LCL+XsNBoogBWrsQH37m78f0KMiMCv5bAIS/ss4iL9W+ywJQJOsZzczB1vcIKxNjvBKnW7BRwraJov/ewqD0x/UPGtsw41yuVSSucDCyCJ0loczjDM0oNR2LnKrJQrcv8JypicksCN/VTxmOzKtx+mnRC/Oty6oZiOQXu1QTe40GQOMOdvZj4YKftlSnMsYCNtH/rHNdJudzAfSTBs28ui8jkXsj2HaecaBtjrBABCaxoGTybuTdb0Vk9Z1V4ueJ7ZDrACeB3TzCodI3MW3pETufIzDEhN36ikC548hUJ0eYxbsGt+wrtUVb3ucs4NAwz6atvX1WJfG+7r+AgA1fthYGEGGyQ1YxfXY699gyojMfxysPK1/Cnmw9fhMhdWUGXcji6d66sPThVe1o1EAE3pbkVYk8P2dFPByaBSumQGEPfdQJT3kxdg0fOFkiOVi5oqEu0+o9q5zbCRg8fj+BzHD5Qym/xEYgCgHdr9Fp5U6vGBfesVpLvMm0Ok9jOLgUu+0wDi3EFA0mP9PMGCFE3EwIGJEwcJbX/27yIbPqm/2XDT+gQtRPWAqMYz/J+GrhtjTf0kwXNx+rG9tjHSjaH/Uq9EnU+ZfHPEyWRJ0DtxT/BxxkQ6aZBzpw3Tt0QSq5l3c6/Fd+3W+TnUuYbwkissRV/QN5jkN+fSOMPUyOO9...";

export default function GoatReveal() {
  return (
    <section aria-label="Cierre AdVibe" className="relative overflow-hidden bg-[#050505] py-20 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_55%,rgba(163,230,53,0.10),transparent_34%)]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="relative min-h-[500px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#07100b] sm:min-h-[560px]">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_15%,rgba(163,230,53,0.035)_55%,transparent_85%)]" />
          <div className="absolute right-[-9rem] top-[-9rem] h-[30rem] w-[30rem] rounded-full border border-lime-300/10" />
          <div className="absolute right-[-4rem] top-[-4rem] h-[21rem] w-[21rem] rounded-full border border-lime-300/10" />

          <div className="relative z-20 max-w-xl px-7 pt-10 sm:px-12 sm:pt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">Creativos por naturaleza</p>
            <h2 className="mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.055em] text-white sm:text-7xl">Resultados.</h2>
            <div className="mt-8 h-px w-40 bg-lime-300" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-white/45">ADVIBE · AGENCIA CREATIVA &amp; TECNOLÓGICA</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 120, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 right-[-4%] z-10 w-[58%] max-w-[590px] sm:right-[2%] sm:w-[52%]"
          >
            <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="relative">
              <div className="absolute left-[18%] top-[22%] h-[55%] w-[60%] rounded-full bg-lime-300/10 blur-[80px]" />
              <img src={GOAT_IMAGE} alt="Cabra AdVibe — Creativos por naturaleza" className="relative block h-auto w-full drop-shadow-[0_35px_65px_rgba(0,0,0,0.75)]" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
