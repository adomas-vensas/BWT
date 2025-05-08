import { floor } from "mathjs"

export const dMaxPhysical = 1
export const uMaxPhysical = 15
const dMaxLattice = 15
const uMaxLattice = 0.3


export function calculateDLattice(dPhysical: number)
{
    return (dMaxLattice * dPhysical) / dMaxPhysical
}

export function calculateDPhysical(dLattice: number)
{
    return (dMaxPhysical * dLattice) / dMaxLattice
}

export function calculateULattice(uPhysical: number)
{
    return (uMaxLattice * uPhysical) / uMaxPhysical 
}


export function calculateResolutions(dLattice: number) : [number, number]
{
    return [floor(20 * 10), floor(10 * 10)]
}

