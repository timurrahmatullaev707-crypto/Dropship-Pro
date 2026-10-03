(() => {
    const localHosts = ["localhost", "127.0.0.1"];
    const apiBaseUrl = localHosts.includes(window.location.hostname)
        ? ""
        : "https://dropship-pro-gcqo.onrender.com";

    window.VALMORA_API_BASE_URL = apiBaseUrl;
    window.valmoraApiUrl = (path) => `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
})();
