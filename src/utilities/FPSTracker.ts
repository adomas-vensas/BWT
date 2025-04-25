export default class FPSTracker{

    private lastFpsUpdate: DOMHighResTimeStamp = 0;
    private frameCount: number = 0;
    private fps: number = 0;
    private fpsElem: HTMLDivElement;

    constructor()
    {
        this.fpsElem = document.createElement('div');
        this.fpsElem.style.position = 'absolute';
        this.fpsElem.style.top = '10px';
        this.fpsElem.style.left = '10px';
        this.fpsElem.style.color = 'white';
        this.fpsElem.style.fontFamily = 'monospace';
        this.fpsElem.style.fontSize = '16px';
        this.fpsElem.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.fpsElem.style.padding = '4px 8px';
        this.fpsElem.style.borderRadius = '4px';
        this.fpsElem.style.zIndex = '999';
        this.fpsElem.innerText = 'FPS: ...';
        document.body.appendChild(this.fpsElem);
    }

    public start()
    {
        this.lastFpsUpdate = performance.now();
        this.frameCount = 0;
        this.fps = 0;
    }

    public track()
    {
        this.frameCount++;
        const now = performance.now();

        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
            this.fpsElem.innerText = `FPS: ${this.fps}`;
        }
    }


}