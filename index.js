const localStorageKey = "gitHubRateMonitorPat";
let updateIntervalId = null;

init();

// Called from page

function saveInLocalStorage() {
    const pat = getAndValidatePat();
    const user = getAndValidateUser();

    if (pat === null || user === null)
        return;

    const data = [{name:"default", pat, user}];

    localStorage.setItem(localStorageKey, JSON.stringify(data));
}

async function stopContinuousUpdate() {
    clearInterval(updateIntervalId);
    updateIntervalId = null;
    document.getElementById("oneTimeUpdate").disabled = false;
    document.getElementById("stopContinuousUpdate").style.display = "none";
    document.getElementById("continuousUpdate").style.display = "";
}

async function updateRateLimitInfoContinuously(){
    const pat = getAndValidatePat();
    const user = getAndValidateUser();

    await updateRateLimitInfoImpl(pat, user);

    updateIntervalId = setInterval(updateRateLimitInfoImpl, 30011, pat, user);
    document.getElementById("oneTimeUpdate").disabled = true;
    document.getElementById("stopContinuousUpdate").style.display = "";
    document.getElementById("continuousUpdate").style.display = "none";
}

async function updateRateLimitInfo(){
    const pat = getAndValidatePat();
    const user = getAndValidateUser();

    await updateRateLimitInfoImpl(pat, user)
}

// Called internally

function init(){
    document.getElementById("stopContinuousUpdate").style.display = "none";

    const json = localStorage.getItem(localStorageKey);
    if (!json)
        return;

    const data = JSON.parse(json);
    document.getElementById("personalAccessToken").value = data[0].pat;
    document.getElementById("user").value = data[0].user;
}

function getAndValidatePat(){
    const pat = document.getElementById("personalAccessToken").value.trim();

    if (pat === ""){
        alert("The personal access token cannot be blank.")
        return null;
    }
    return pat;
}

function getAndValidateUser(){
    const user = document.getElementById("user").value.trim();

    if (user === ""){
        alert("The username cannot be blank.")
        return null;
    }
    return user;
}

async function updateRateLimitInfoImpl(pat, user) {

    if (pat === null || user === null)
        return;

    const data = await fetchRateData(pat, user);

    const dateOptions = {dateStyle: "full", timeStyle:"full"}
    let lastFetchTime = new Date().toLocaleString("en-gb", dateOptions);
    console.log(`Updating at ${lastFetchTime}.`);
    document.getElementById("lastFetch").innerText = lastFetchTime;

    let html = "";
    const orderedResources = Object.entries(data.resources)
        .sort((a,b)=>{
            const aa = a[0];
            const bb = b[0];
            if (aa < bb)
                return -1;
            if (aa > bb)
                return 1;
            return 0;
        });
    const timeOptions = {hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit", timeZoneName:"short"};
    for(const [name, values] of orderedResources){
        const friendlyName = name
            .replace("_", " ")
            .replace("_", " ");
        const resetTime = new Date(values.reset * 1000).toLocaleTimeString("en-gb", timeOptions);
        const percent = (values.used / values.remaining).toFixed(0);
        html += `<tr><td rowspan='2' scope='row'>${friendlyName}</td>`;
        html += `<td>${values.limit}</td>`;
        html += `<td>${values.used}</td>`;
        html += `<td>${values.remaining}</td>`;
        html += `<td>${resetTime}</td>`;
        html += "</tr>";
        html += "<tr><td colspan='4'>";
        html += "<div class='progress'>";
        html += `<div class='progress-bar' role='progressbar' aria-label='Progress of ${friendlyName}' style='width: ${percent}%' aria-valuenow='${values.used}' aria-valuemin='0' aria-valuemax='${values.limit}'>${values.used} of ${values.limit}</div>`;
        html += "</div>";
        html += "</td></tr>"
    }
    document.getElementById("renderedData").innerHTML = html;
    document.getElementById("dataDisplay").style.display = "";
}

async function fetchRateData(pat, user){
    const url = "https://api.github.com/rate_limit";
    const response = await fetch(url, {
        method:"GET",
        headers:{
            "Accept": "application/vnd.github+json",
            "User-Agent": user,
            "Authorization": `token ${pat}`
        }
    });

    if (response.status !== 200)
        console.log(response);
    return response.json();
}