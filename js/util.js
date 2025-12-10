// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
export function getYoutubeIdFromUrl(url) {
    return url.match(
        /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/,
    )?.[1] ?? '';
}

export function getMedalIdFromUrl(url) {
    return url.match(/medal\.tv\/(?:clip|clips|games\/[^\/]+\/clips)\/([^\/?#]+)/)?.[1] ?? '';
}

export function getTwitchClipIdFromUrl(url) {
    let match = url.match(/clips\.twitch\.tv\/([^\/?#]+)/);
    if (match) return match[1];

    match = url.match(/twitch\.tv\/[^\/]+\/clip\/([^\/?#]+)/);
    if (match) return match[1];

    match = url.match(/twitch\.tv\/clip\/([^\/?#]+)/);
    if (match) return match[1];

    return '';
}

export function getGoogleDriveIdFromUrl(url) {
    if (!url) return '';
    // /file/d/ID/... or /file/d/ID
    let match = url.match(/drive\.google\.com\/file\/d\/([^\/?#]+)/);
    if (match) return match[1];

    // open?id=ID
    match = url.match(/drive\.google\.com\/open\?id=([^&\/#]+)/);
    if (match) return match[1];

    // share link that sometimes includes uc?id=ID
    match = url.match(/uc\?id=([^&\/#]+)/);
    if (match) return match[1];

    return '';
}

// Detect basic video platform type
export function getVideoPlatform(url) {
    if (url && /youtu\.?be/.test(url)) return "youtube";
    if (url && /medal\.tv/.test(url)) return "medal";
    if (url && (/twitch\.tv/.test(url) || /clips\.twitch\.tv/.test(url))) return "twitch";
    if (url && /drive\.google\.com/.test(url)) return "googledrive";
    return "unknown";
}

export function embed(video) {
    const platform = getVideoPlatform(video);

    if (platform === "youtube") {
        return `https://www.youtube.com/embed/${getYoutubeIdFromUrl(video)}`;
    }

    if (platform === "medal") {
        const id = getMedalIdFromUrl(video);
        return `https://medal.tv/clip/${id}`;
    }

    if (platform === "twitch") {
        const id = getTwitchClipIdFromUrl(video);
        const parent = (typeof window !== "undefined" && window.location && window.location.hostname)
            ? window.location.hostname
            : "localhost";
        return `https://clips.twitch.tv/embed?clip=${id}&parent=${parent}`;
    }

    if (platform === "googledrive") {
        const id = getGoogleDriveIdFromUrl(video);
        return `https://drive.google.com/file/d/${id}/preview`;
    }

    return video;
}

export function localize(num) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 3 });
}

// Get thumbnail image depending on platform
export function getThumbnailFromId(urlOrId) {
    if (!urlOrId) return '';

    const input = String(urlOrId).trim();
    const platform = getVideoPlatform(input);

    const possibleYouTubeId = input.match(/^[A-Za-z0-9_-]{6,}$/);

    if (platform === "youtube") {
        const id = getYoutubeIdFromUrl(input) || (possibleYouTubeId && possibleYouTubeId[0]);
        if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }

    if (platform === "unknown" && possibleYouTubeId) {
        return `https://img.youtube.com/vi/${possibleYouTubeId[0]}/mqdefault.jpg`;
    }

    if (platform === "medal") {
        const id = getMedalIdFromUrl(input);
        if (id) return `https://medal.tv/clip/${id}`;
    }

    if (platform === "twitch") {
        const id = getTwitchClipIdFromUrl(input);
        if (id) return `https://clips-media-assets2.twitch.tv/${id}-preview-480x272.jpg`;
    }

    if (platform === "googledrive") {
        const id = getGoogleDriveIdFromUrl(input);
        if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w544-h306`;
    }

    return '';
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex],
        ];
    }

    return array;
}
