const localStorageKey = "gitHubRateMonitorPat";

init();

function init(){
    const json = localStorage.getItem(localStorageKey);
    if (!json)
        return;

    console.log(json);
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

function saveInLocalStorage() {
    const pat = getAndValidatePat();
    const user = getAndValidateUser();

    if (pat === null || user === null)
        return;

    const data = [{name:"default", pat, user}];

    localStorage.setItem(localStorageKey, JSON.stringify(data));
}

async function updateRateLimitInfo() {
    const pat = getAndValidatePat();
    const user = getAndValidateUser();

    if (pat === null || user === null)
        return;

    const data = await fetchRateData(pat, user);
    console.log(data);
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

    console.log(response);
    return response.json();
}