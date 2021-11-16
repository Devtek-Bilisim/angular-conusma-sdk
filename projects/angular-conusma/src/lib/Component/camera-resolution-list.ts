import { CameraResolution } from "./camera-resolution";

export class CameraResolutionList
{
    constructor()
    {
        this.quickScan = [
            {
                "label": "4K(UHD)",
                "width": 3840,
                "height": 2160,
                "ratio": "16:9"
            },
            {
                "label": "1080p(FHD)",
                "width": 1920,
                "height": 1080,
                "ratio": "16:9"
            },
            {
                "label": "UXGA",
                "width": 1600,
                "height": 1200,
                "ratio": "4:3"
            },
            {
                "label": "720p(HD)",
                "width": 1280,
                "height": 720,
                "ratio": "16:9"
            },
            {
                "label": "SVGA",
                "width": 800,
                "height": 600,
                "ratio": "4:3"
            },
            {
                "label": "VGA",
                "width": 640,
                "height": 480,
                "ratio": "4:3"
            },
            {
                "label": "360p(nHD)",
                "width": 640,
                "height": 360,
                "ratio": "16:9"
            },
            {
                "label": "CIF",
                "width": 352,
                "height": 288,
                "ratio": "4:3"
            },
            {
                "label": "QVGA",
                "width": 320,
                "height": 240,
                "ratio": "4:3"
            },
            {
                "label": "QCIF",
                "width": 176,
                "height": 144,
                "ratio": "4:3"
            },
            {
                "label": "QQVGA",
                "width": 160,
                "height": 120,
                "ratio": "4:3"
            }
        
        ];
    }
    public quickScan:CameraResolution[] = new Array();
}
