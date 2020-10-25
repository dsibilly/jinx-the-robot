export default s => {
    const ms = s % 1000,
        pad = (n, z) => {
            z = z || 2;
            return `00${n}`.slice(-z);
        };

    let secs,
        mins,
        hrs;

    s = (s - ms) / 1000;
    secs = s % 60;
    s = (s - secs) / 60;
    mins = s % 60;
    hrs = (s - mins) / 60;

    return `${hrs}h${mins}m${secs}.${pad(ms, 3)}s`;
};
