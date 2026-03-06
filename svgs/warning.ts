export function renderWarning(container: HTMLDivElement) {
    const warningSvg = container.createSvg("svg", "warning-icon", (svg) => {
        svg.setAttr("xmlns", "http://www.w3.org/2000/svg");
        svg.setAttr("width", "28"); 
        svg.setAttr("height", "28");
        svg.setAttr("viewBox", "0 0 24 24");
        svg.setAttr("fill", "none");
        svg.setAttr("stroke", "currentColor");
        svg.setAttr("stroke-width", "2");
        svg.setAttr("stroke-linecap", "round");
        svg.setAttr("stroke-linejoin", "round");

        // Paths
        svg.createSvg("path", "", (path) => { 
            path.setAttr("d", "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"); 
        });
        svg.createSvg("path", "", (path) => { 
            path.setAttr("d", "M12 15h.01"); 
        });
        svg.createSvg("path", "", (path) => { 
            path.setAttr("d", "M12 7v4"); 
        });
    });
    return warningSvg
}
