export function renderLoader(badge: HTMLDivElement) {
    const loaderSvg = badge.createSvg("svg", "loader-icon", (svg) => {
        svg.setAttr("xmlns", "http://www.w3.org/2000/svg");
        svg.setAttr("width", "13"); 
        svg.setAttr("height", "13");
        svg.setAttr("viewBox", "0 0 24 24");
        svg.setAttr("fill", "none");
        svg.setAttr("stroke", "currentColor");
        svg.setAttr("stroke-width", "2");
        svg.setAttr("stroke-linecap", "round");
        svg.setAttr("stroke-linejoin", "round");

        svg.createSvg("path", "", (path) => {
            path.setAttr("d", "M21 12a9 9 0 1 1-6.219-8.56");
        });
    });

    return loaderSvg
}

export function renderLoader2(badge: HTMLDivElement) {
    const loaderSvg = badge.createSvg("svg", "loader-icon", (svg) => {
        svg.setAttr("xmlns", "http://www.w3.org/2000/svg");
        svg.setAttr("width", "14"); 
        svg.setAttr("height", "14");
        svg.setAttr("viewBox", "0 0 24 24");
        svg.setAttr("fill", "none");
        svg.setAttr("stroke", "currentColor");
        svg.setAttr("stroke-width", "2");
        svg.setAttr("stroke-linecap", "round");
        svg.setAttr("stroke-linejoin", "round");

        svg.createSvg("path", "", (path) => { path.setAttr("d", "M12 2v4"); });
        svg.createSvg("path", "", (path) => { path.setAttr("d", "m16.2 7.8 2.9-2.9"); });
        svg.createSvg("path", "", (path) => { path.setAttr("d", "M18 12h4"); });
        svg.createSvg("path", "", (path) => { path.setAttr("d", "m16.2 16.2 2.9 2.9"); });
        svg.createSvg("path", "", (path) => { path.setAttr("d", "M12 18v4"); });
        svg.createSvg("path", "", (path) => { path.setAttr("d", "m4.9 19.1 2.9-2.9"); });
        svg.createSvg("path", "", (path) => { path.setAttr("d", "M2 12h4"); });
        svg.createSvg("path", "", (path) => { path.setAttr("d", "m4.9 4.9 2.9 2.9"); });
    });

    return loaderSvg
}
