export interface SimulationParamsRequest {
    reynoldsNumber: number;
    reducedVelocity: number;
    dampingRatio: number;
    windSpeed: number;
    cylinderDiameter: number;
    massRatio: number;
    nx: number;
    ny: number
}