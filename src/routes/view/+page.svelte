<script>
    import { onMount } from "svelte";
    import { io } from "socket.io-client";
    import { fly, fade, scale } from "svelte/transition";

    let message = $state("");
    let isLoading = $state(true);
    let highesid = $state(0);
    let nowId = $state(0);
    let datasoal = $state({});
    let datateam = $state([]);
    let poinColorClasses = $state([]);
    let displayPoinData = $state(null);
    let showOverlay = $state(false);
    let overlayMessage = $state("");

    let socket;
    let countdown = $state(0); // initial countdown seconds
    let isCountingDown = $state(false);
    let timeoutCountdown = $state(0);

    const colorClasses = [
        "bg-[#104b93]",
        "bg-[#ab342c]",
        "bg-[#688b37]",
        "bg-[#f2aa05]",
        "bg-purple-500",
        "bg-red-500",
        "bg-indigo-500",
        "bg-teal-500",
    ];

    const txcolorClasses = [
        "text-[#104b93]",
        "text-[#ab342c]",
        "text-[#688b37]",
        "text-[#f2aa05]",
        "text-purple-500",
        "text-red-500",
        "text-indigo-500",
        "text-teal-500",
    ];

    let delayInterval = null;
    let timeoutInterval = null;
    let startTimeout = null;

    async function preloadAssets(urls) {
        let loaded = 0;
        const total = urls.length;

        await Promise.all(
            urls.map((url) => {
                return new Promise((resolve) => {
                    const ext = url.split(".").pop().toLowerCase();

                    if (["png", "jpg", "jpeg", "svg"].includes(ext)) {
                        const img = new Image();
                        img.onload = img.onerror = () => {
                            loaded++;
                            resolve();
                        };
                        img.src = url;
                    } else if (["mp4", "webm"].includes(ext)) {
                        const video = document.createElement("video");
                        video.onloadeddata = video.onerror = () => {
                            loaded++;
                            resolve();
                        };
                        video.src = url;
                    } else if (["ogg", "m4a", "mp3", "wav"].includes(ext)) {
                        const audio = new Audio();
                        audio.onloadeddata = audio.onerror = () => {
                            loaded++;
                            resolve();
                        };
                        audio.src = url;
                    } else {
                        loaded++;
                        resolve();
                    }
                });
            }),
        );
    }

    onMount(async () => {
        await preloadAssets([
            
            "/benar.mp3",
            "/bg-lcc.png",
            "/bg.mp4",
            "/cerdas.png",
            "/correct.mp3",
            "/favicon.svg",
            "/hei.png",
            "/hogeng.ogg",
            "/salah.mp3",
            "/stars.png",
            "/timeout.mp3",
            "/wrong.mp3",

            
            "/music/egodanairmata.mp3",
            "/music/lewatkataindah.mp3",
            "/music/semogalagucinta.mp3",
            "/music/soal_egodanairmata.m4a",
            "/music/soal_lewatkataindah.m4a",
            "/music/soal_semogalagucinta.m4a",
            "/music/soal_teringatserusuaramu.m4a",
            "/music/teringatserusuaramu.mp3",
        ]);
        isLoading = false;

        startTimeout = () => {
            timeoutInterval = setInterval(() => {
                console.log("ahjs");
                if (timeoutCountdown <= 0) {
                    console.log();
                    clearInterval(timeoutInterval);
                    timeoutInterval = null;
                } else {
                    timeoutCountdown -= 1;
                }
            }, 1000);
        };

        console.log("Connecting to server...");
        socket = io("http://10.192.8.27:3000");

        socket.on("connect", () => {
            console.log("Connected to server");
        });

        socket.on("getTeam", (teamList) => {
            datateam = teamList;
        });

        socket.on("showChange", ({ team, mode }) => {
            showOverlay = true;
            if (mode == "utamas") {
                overlayMessage = `Waktunya ${team.name} Menjawab`;
            } else {
                overlayMessage = `Hak Menjawab dilempar ke ${team.name} `;
            }
            setTimeout(() => {
                showOverlay = false;
                overlayMessage = "";
            }, 3000);
        });

        socket.on("getProgramSoal", (programData) => {
            datasoal = programData;
            countdown = programData.isDelay ? programData.delay : 0;
            timeoutCountdown = programData.timeout;
            isCountingDown = countdown > 0;

            if (isCountingDown) {
                if (delayInterval) {
                    clearInterval(delayInterval);
                }
                delayInterval = setInterval(() => {
                    countdown -= 1;
                    if (countdown <= 0) {
                        clearInterval(delayInterval);
                        delayInterval = null;
                        isCountingDown = false;
                    }
                }, 1000);
            } else {
            }
        });

        socket.on("playEffect", (name) => {
            if (name == "benar") {
                new Audio("/benar.mp3").play();
            } else if (name == "salah") {
                new Audio("/salah.mp3").play();
            } else if (name == "timeout") {
                new Audio("/timeout.mp3").play();

                // ===== MUSIC =====
            } else if (name == "egodanairmata") {
                new Audio("/music/egodanairmata.mp3").play();
            } else if (name == "lewatkataindah") {
                new Audio("/music/lewatkataindah.mp3").play();
            } else if (name == "semogalagucinta") {
                new Audio("/music/semogalagucinta.mp3").play();
            } else if (name == "soal_egodanairmata") {
                new Audio("/music/soal_egodanairmata.m4a").play();
            } else if (name == "soal_lewatkataindah") {
                new Audio("/music/soal_lewatkataindah.m4a").play();
            } else if (name == "soal_semogalagucinta") {
                new Audio("/music/soal_semogalagucinta.m4a").play();
            } else if (name == "soal_teringatserusuaramu") {
                new Audio("/music/soal_teringatserusuaramu.m4a").play();
            } else if (name == "teringatserusuaramu") {
                new Audio("/music/teringatserusuaramu.mp3").play();
            }
        });

        socket.on("displayPoin", (data) => {
            console.log(data);
            if (data.correct) {
                var audio = new Audio("/benar.mp3");
                audio.play();
            } else {
                var audio = new Audio("/salah.mp3");
                audio.play();
            }
            setTimeout(() => {
                displayPoinData = data;
            }, 500);
        });

        socket.on("getTimer", () => {
            clearInterval(timeoutInterval);
            if (timeoutCountdown > 0) {
                startTimeout();
            }
        });

        socket.on("unshowProgramSoal", () => {
            datasoal = {};
            countdown = 0;
            timeoutCountdown = 0;
            displayPoinData = null;

            if (delayInterval) {
                clearInterval(delayInterval);
                delayInterval = null;
            }

            if (timeoutInterval) {
                clearInterval(timeoutInterval);
                timeoutInterval = null;
            }

            isCountingDown = false;
        });

        return () => {
            socket.disconnect();
            console.log("Disconnected from server");
        };
    });
</script>

<div
    class="w-screen h-screen flex flex-col justify-between items-center relative z-10 overflow-hidden"
>
    <img
        src="/bg-lcc.png"
        alt="Background"
        class="absolute w-full h-full object-fill z-10"
    />
    <video
        src="/bg.mp4"
        class="absolute w-full h-full object-fill z-0"
        loop
        muted
        autoplay
    ></video>
    <div class="w-full h-full z-20">
        {#if isLoading}
            <div
                class="fixed inset-0 bg-black/40 bg-opacity-60 flex items-center justify-center z-50"
                transition:fade={{ delay: 100 }}
            >
                <div
                    class="bg-red-400 flex justify-center items-center w-full h-52 text-red-950 text-2xl font-bold p-6 rounded shadow-xl"
                    transition:fly={{ x: -200 }}
                >
                    <p class="text-6xl">Memuat Aset, Harap Tunggu...</p>
                </div>
            </div>
        {/if}
        {#if showOverlay}
            <div
                class="fixed inset-0 bg-black/40 bg-opacity-60 flex items-center justify-center z-50"
                transition:fade={{ delay: 100 }}
            >
                <div
                    class="bg-white flex justify-center items-center w-full h-52 text-black text-2xl font-bold p-6 rounded shadow-xl"
                    transition:fly={{ x: -200 }}
                >
                    <p class="text-6xl">{overlayMessage}</p>
                </div>
            </div>
        {/if}
        <div
            class="absolute top-12 right-20 bg-white border-[#104b93] border-4 rounded-2xl py-4 px-8 font-extrabold text-5xl text-[#688b37]"
        >
            <h2
                class={datasoal.isTimeout && timeoutCountdown === 0
                    ? "text-red-600"
                    : ""}
            >
                {#if datasoal.isTimeout}
                    00:{timeoutCountdown.toString().padStart(2, "0")}
                {:else}
                    -- : --
                {/if}
            </h2>
        </div>
        <div class="absolute top-38 w-full">
            <h2
                class="font-league text-6xl font-bold text-center text-[#688b37]"
            >
                QUESTION
            </h2>
        </div>

        <div
            class="w-full absolute justify-center gap-x-10 items-center top-60"
        >
            {#if !isCountingDown && datasoal.soal}
                <div
                    class="flex w-full justify-center"
                    transition:scale={{ delay: 100 }}
                >
                    <img src="/cerdas.png" alt="Logo LCC" class="w-72" />
                    <div
                        class="flex border-3 mt-10 border-[#af1b1e] overflow-hidden rounded-xl w-fit h-fit"
                    >
                        <div
                            class="flex flex-col justify-center py-4 items-center px-6 w-[780px] bg-white rounded-l-xl"
                        >
                            <p class="font-raleway text-3xl self-start">
                                {datasoal.soal}
                            </p>
                            {#if datasoal.type === "opsi"}
                                <ul
                                    class="flex flex-wrap gap-4 mt-4 text-xl font-semibold text-white"
                                >
                                    {#each datasoal.options as option, index}
                                        {@const optionClass = displayPoinData
                                            ? displayPoinData.correct &&
                                              !displayPoinData.hideAnswer &&
                                              displayPoinData.userJawab ===
                                                  index
                                                ? "bg-green-500 text-white"
                                                : !displayPoinData.correct &&
                                                    displayPoinData.userJawab ===
                                                        index
                                                  ? "bg-red-500 text-white"
                                                  : !displayPoinData.correct &&
                                                      !displayPoinData.hideAnswer &&
                                                      index === datasoal.jawaban
                                                    ? "bg-green-500 text-white"
                                                    : "border border-black text-black"
                                            : colorClasses[index] +
                                              " text-white"}
                                        <li
                                            class={"flex rounded-full justify-center items-center px-6 py-2 w-[300px] font-semibold " +
                                                optionClass}
                                        >
                                            <p class="font-normal mr-2">
                                                {String.fromCharCode(
                                                    65 + index,
                                                )}.
                                            </p>
                                            {option}
                                        </li>
                                    {/each}
                                </ul>
                            {:else if datasoal.type === "uraian"}
                                <div class="mt-6 text-3xl font-semibold">
                                    {#if displayPoinData}
                                        {#if displayPoinData.correct}
                                            <p class="text-green-600">
                                                Jawaban Kamu Benar!
                                            </p>
                                        {:else}
                                            <p class="text-red-600">
                                                Jawaban Kamu Salah!<br />
                                                {#if !displayPoinData.hideAnswer}
                                                    <span class="text-black"
                                                        >Jawaban Benar: {datasoal.jawaban}</span
                                                    >
                                                {/if}
                                            </p>
                                        {/if}
                                    {/if}
                                </div>
                            {/if}
                        </div>

                        <div
                            class="w-6 bg-white h-auto border-r-3 border-[#af1b1e] rounded-xl"
                        ></div>

                        <div
                            class="bg-white flex justify-center items-center rounded-r-xl py-10 px-4"
                        >
                            <img
                                src="/hei.png"
                                alt="HEI"
                                class="object-contain h-28"
                            />
                        </div>
                    </div>
                </div>
            {:else if datasoal.soal}
                <div
                    class="absolute top-10 w-full text-center"
                    transition:scale={{ delay: 100 }}
                >
                    <h2 class="text-5xl font-bold text-red-600">
                        Soal akan muncul dalam:
                    </h2>
                    <p class="text-red-600 h-fit text-[250px] leading-none">
                        {countdown}
                    </p>
                </div>
            {/if}
        </div>

        <div class=" w-full flex justify-center gap-x-20 absolute bottom-40">
            {#each datateam as team, index}
                <div
                    class="bg-white border-2 font-league flex items-center gap-x-5 border-[#688b37] py-8 px-10 rounded-xl"
                    transition:fly={{ y: 200 }}
                >
                    <div class="space-y-2 mr-14">
                        <h2
                            class="font-bold text-6xl font-league {txcolorClasses[
                                index
                            ]}"
                        >
                            {team.name}
                        </h2>
                        <p class="font-bold text-6xl">{team.points}</p>
                    </div>
                    <div>
                        <p class="text-9xl font-bold {txcolorClasses[index]}">
                            {team.huruf}
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
