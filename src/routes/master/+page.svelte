<script>
    import { onMount } from "svelte";
    import { io } from "socket.io-client";

    let status = $state("");
    let socket;
    let delayInterval = null;
    let timeoutInterval = null;
    let datateam = $state([]);
    let datasoal = $state({});
    let programSoal = $state({});
    let soalList = $state([]);
    let currentSoalIndex = $state(0);
    let selectedTeam = $state(null);
    let datababak = $state([]);
    let selectedBabak = $state("");
    let datapaketsoal = $state([]);
    let selectedPaket = $state("");

    let poinBenar = $state(0);
    let poinSalah = $state(0);
    let modeUraian = $state("utamas");

    let showDelay = $state(true);
    let showTimeout = $state(true);
    let delay = $state(3);
    let timeout = $state(5);

    function selectBabak(babak) {
        selectedBabak = babak;
        socket.emit("reqTeam", babak);
    }

    function handleClearSoal() {
        // Reset all related values
        selectedPaket = "";
        currentSoalIndex = 0;
        datasoal = {};
        soalList = [];
        poinBenar = 0;
        poinSalah = 0;
    }

    function selectTeam(index) {
        selectedTeam = index;
    }

    function selectPaket(paket) {
        selectedPaket = paket;
        socket.emit("reqSoal", paket);
    }

    function sendPilihanGanda(jawaban, hideAnswer = false) {
        if (selectedTeam === null || !programSoal?.poin) return;
        const correctAnswer = programSoal.jawaban;
        console.log({
            paket: programSoal.paket,
            index: programSoal.index,
        });
        const isCorrect = jawaban === correctAnswer;
        if (isCorrect) {
            socket.emit("reqIsAnswered", {
                paket: programSoal.paket,
                index: programSoal.index,
            });
        }
        const data = {
            index: selectedTeam,
            poin: isCorrect ? poinBenar : poinSalah,
            babak: selectedBabak,
            teamIndex: selectedTeam,
            correct: isCorrect,
            dataSend: programSoal,
            userJawab: jawaban,
            hideAnswer,
        };
        socket.emit("reqPoinTeam", data);
        selectTeam(null);
    }

    function sendRespondUraian(isCorrect, hideAnswer = false) {
        if (selectedTeam === null || !programSoal?.poin) return;
        const data = {
            index: selectedTeam,
            poin: isCorrect ? poinBenar : poinSalah,
            babak: selectedBabak,
            teamIndex: selectedTeam,
            correct: isCorrect,
            dataSend: programSoal,
            hideAnswer,
        };
        if (isCorrect) {
            socket.emit("reqIsAnswered", {
                paket: programSoal.paket,
                index: programSoal.index,
            });
        }
        socket.emit("reqPoinTeam", data);
        selectTeam(null);
    }

    function handleShowSoal() {
        socket.emit("unshowProgramSoal");
        if (soalList.length > 0 && socket) {
            const soalToSend = {
                index: soalList[currentSoalIndex].originalIndex,
                ...soalList[currentSoalIndex],
                isDelay: showDelay,
                isTimeout: showTimeout,
                delay,
                timeout,
                poin: datasoal.poin,
                minus: datasoal.minus,
                paket: selectedPaket,
            };
            socket.emit("reqProgramSoal", soalToSend);
        }
    }

    function transPemain() {
        if (selectedTeam !== null && socket) {
            const data = {
                team: datateam[selectedTeam],
                mode: modeUraian,
            };
            socket.emit("reqChange", data);
        }
    }

    onMount(() => {
        status = "connecting";
        console.log("Connecting to server...");
        socket = io("http://localhost:3000");

        socket.on("connect", () => {
            status = "connected";
            console.log("Connected to server");

            socket.emit("reqBabak");
            socket.emit("reqPaketSoal");

            // Listen for unshowProgramSoal event
        });

        socket.on("unshowProgramSoal", () => {
            programSoal = {};
            if (delayInterval) {
                clearInterval(delayInterval);
                delayInterval = null;
            }
            if (timeoutInterval) {
                clearInterval(timeoutInterval);
                timeoutInterval = null;
            }
            programSoal = {};
        });

        socket.on("disconnect", () => {
            status = "disconnected";
        });

        socket.on("getBabak", (babakList) => {
            console.log("Received babak list:", babakList);
            datababak = babakList;
        });

        socket.on("getTeam", (teamList) => {
            datateam = teamList;
        });

        socket.on("getPaketSoal", (paketList) => {
            console.log("Received paket soal list:", paketList);
            datapaketsoal = paketList;
        });

        socket.on("getSoal", (soalPaket) => {
            datasoal = soalPaket;

            if (soalPaket?.data) {
                soalList = soalPaket.data;
                currentSoalIndex = 0;
            }
        });

        // Listen for getProgramSoal event (refactored with countdown and timeout status)
        socket.on("getProgramSoal", (programData) => {
            console.log("Received program soal:", programData);

            const {
                index,
                type,
                soal,
                options,
                jawaban,
                isDelay,
                isTimeout,
                delay,
                timeout,
                paket,
            } = programData;

            function startTimeoutCountdown(timeoutValue) {
                let timeoutCount = timeoutValue || 5;

                programSoal = {
                    ...programSoal,
                    countdown: timeoutCount,
                };
                timeoutInterval = setInterval(() => {
                    timeoutCount--;
                    if (timeoutCount >= 0) {
                        programSoal = {
                            ...programSoal,
                            countdown: timeoutCount,
                        };
                    }
                    if (timeoutCount <= 0) {
                        clearInterval(timeoutInterval);
                        timeoutInterval = null;
                        programSoal = {
                            ...programSoal,
                            countdown: null,
                            status: "timeout",
                        };
                    }
                }, 1000);
            }

            if (isDelay) {
                let count = delay || 3;
                programSoal = { show: false, countdown: count, paket };
                poinBenar = programData.poin;
                poinSalah = programData.minus;
                delayInterval = setInterval(() => {
                    count--;
                    if (count > 0) {
                        programSoal = { show: false, countdown: count, paket };
                    } else {
                        clearInterval(delayInterval);
                        delayInterval = null;
                        programSoal = {
                            show: true,
                            countdown: isTimeout ? timeout : undefined,
                            type,
                            soal,
                            options,
                            jawaban,
                            index,
                            status: "active",
                            timeout: isTimeout,
                            poinBenar: programData.poin,
                            poinSalah: programData.minus,
                            poin: programData.poin,
                            minus: programData.minus,
                            paket,
                        };
                        if (isTimeout) {
                            startTimeoutCountdown(timeout);
                        }
                    }
                }, 1000);
            } else {
                // Show the soal and start timeout countdown if enabled
                programSoal = {
                    show: true,
                    countdown: isTimeout ? timeout : undefined,
                    type,
                    soal,
                    options,
                    jawaban,
                    index,
                    status: "active",
                    timeout: isTimeout,
                    poinBenar: programData.poin,
                    poinSalah: programData.minus,
                    poin: programData.poin,
                    minus: programData.minus,
                    paket,
                };
                poinBenar = programData.poin;
                poinSalah = programData.minus;
                if (isTimeout) {
                    startTimeoutCountdown(timeout);
                }
            }
        });

        return () => {
            socket.disconnect();
            console.log("Disconnected from server");
        };
    });
</script>

<div class=" w-screen bg-black min-h-screen">
    <div class="w-full px-4 py-3 flex justify-between">
        <h2 class="text-white text-xl font-bold">Master Control</h2>
        {#if status === "connected"}
            <div class="w-5 h-5 rounded-full bg-green-500"></div>
        {:else if status === "disconnected"}
            <div class="w-5 h-5 rounded-full bg-red-600"></div>
        {:else}
            <div class="w-5 h-5 rounded-full bg-yellow-400"></div>
        {/if}
    </div>
    <div class="text-white px-2 flex">
        <div class="border border-white w-4/12 space-y-2 p-3">
            <div class="border border-white p-2">
                Babak :
                <div class="mt-2 flex gap-2 flex-wrap">
                    {#each datababak as babak}
                        <button
                            class="{selectedBabak == babak
                                ? 'bg-green-400'
                                : 'bg-white'} text-black px-3 py-1 rounded"
                            onclick={() => {
                                selectBabak(babak);
                            }}
                        >
                            {babak}
                        </button>
                    {/each}
                </div>
            </div>

            <div class="border border-white p-2">
                <p>Tim Yang Menjawab :</p>
                <div class="flex gap-x-2">
                    {#each datateam as team, index}
                        <button
                            class="flex {selectedTeam == index
                                ? 'bg-green-400'
                                : 'bg-white'} text-black justify-between items-center p-2"
                            onclick={() => {
                                selectTeam(index);
                            }}
                        >
                            <span>{team.name}</span>
                        </button>
                    {/each}
                </div>
                <div class="flex gap-x-2 mt-2 items-center">
                    <p>Mode :</p>
                    <div class="flex gap-x-4 my-2 items-center">
                        <div>
                            <input
                                type="radio"
                                id="utama"
                                name="mode_ur"
                                value="utamas"
                                bind:group={modeUraian}
                            />
                            <label for="utama">Utama</label>
                        </div>

                        <div>
                            <input
                                type="radio"
                                id="lempar"
                                name="mode_ur"
                                value="lempars"
                                bind:group={modeUraian}
                            />
                            <label for="lempar">Lemparan</label>
                        </div>
                    </div>
                </div>
                <div class="mt-4 space-x-2">
                    {#if selectedTeam !== null}
                        <button class="bg-blue-500 p-1" onclick={transPemain}>
                            Show
                        </button>
                    {/if}
                    <button
                        class="bg-red-500 p-1"
                        onclick={() => {
                            selectTeam(null); // Reset selected team
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div class="border border-white w-full space-y-2 p-3">
                <p>Statistik Tim</p>
                <ul>
                    {#each datateam as team, index}
                        <li class="flex justify-between">
                            <span>{team.name}</span>
                            <span>{team.points || 0}</span>
                        </li>
                    {/each}
                </ul>
                {#if selectedBabak != ""}
                    <button class="bg-amber-200 text-black p-1"
                        >Show Winner</button
                    >
                {/if}
            </div>
            {#if selectedTeam !== null}
                <div class="mt-4 border p-2">
                    <p class="font-semibold">Control Answer</p>
                    <div class="flex mt-4 flex-col items-center gap-x-2">
                        <div class=" flex gap-x-4">
                            <div>
                                <p>Poin Benar:</p>
                                <input
                                    type="number"
                                    class="border-2 bg-white text-black p-2 rounded-md"
                                    placeholder="Masukkan poin..."
                                    bind:value={poinBenar}
                                />
                            </div>
                            <div>
                                <p>Poin Salah:</p>
                                <input
                                    type="number"
                                    class="border-2 bg-white text-black p-2 rounded-md"
                                    placeholder="Masukkan poin..."
                                    bind:value={poinSalah}
                                />
                            </div>
                        </div>

                        <div></div>
                        <div class="border my-4 gap-x-2 flex">
                            {#if programSoal.type === "opsi"}
                                <div class="p-2">
                                    <p>Answer Pilihan Ganda</p>
                                    <div class="flex gap-x-3">
                                        <button
                                            class="w-14 h-14 rounded-sm bg-red-600"
                                            onclick={() => sendPilihanGanda(0)}
                                            >A</button
                                        >
                                        <button
                                            class="w-14 h-14 rounded-sm bg-blue-600"
                                            onclick={() => sendPilihanGanda(1)}
                                            >B</button
                                        >
                                        <button
                                            class="w-14 h-14 rounded-sm bg-purple-600"
                                            onclick={() => sendPilihanGanda(2)}
                                            >C</button
                                        >
                                        <button
                                            class="w-14 h-14 rounded-sm bg-amber-400"
                                            onclick={() => sendPilihanGanda(3)}
                                            >D</button
                                        >
                                    </div>
                                </div>
                            {/if}
                            {#if programSoal.type === "uraian"}
                                <div class="border-l p-2 space-y-2">
                                    <p>Answer Uraian</p>
                                    <div
                                        class="flex gap-x-3 items-center justify-center"
                                    >
                                        <button
                                            class="w-12 h-12 rounded-sm bg-green-600"
                                            onclick={sendRespondUraian.bind(
                                                null,
                                                true,
                                            )}>Benar</button
                                        >
                                        <button
                                            class="w-12 h-12 rounded-sm bg-red-600"
                                            onclick={sendRespondUraian.bind(
                                                null,
                                                false,
                                            )}>Salah</button
                                        >
                                    </div>
                                </div>
                            {/if}
                        </div>
                        <div class="border my-4 gap-x-2 flex">
                            {#if programSoal.type === "opsi"}
                                <div class="p-2">
                                    <p>
                                        Answer Pilihan Ganda (Not Reveal Answer)
                                    </p>
                                    <div class="flex gap-x-3">
                                        <button
                                            class="w-14 h-14 rounded-sm bg-red-600"
                                            onclick={() =>
                                                sendPilihanGanda(0, true)}
                                            >A</button
                                        >
                                        <button
                                            class="w-14 h-14 rounded-sm bg-blue-600"
                                            onclick={() =>
                                                sendPilihanGanda(1, true)}
                                            >B</button
                                        >
                                        <button
                                            class="w-14 h-14 rounded-sm bg-purple-600"
                                            onclick={() =>
                                                sendPilihanGanda(2, true)}
                                            >C</button
                                        >
                                        <button
                                            class="w-14 h-14 rounded-sm bg-amber-400"
                                            onclick={() =>
                                                sendPilihanGanda(3, true)}
                                            >D</button
                                        >
                                    </div>
                                </div>
                            {/if}
                            {#if programSoal.type === "uraian"}
                                <div class="border-l p-2 space-y-2">
                                    <p>Answer Uraian (Not Reveal Answer)</p>
                                    <div
                                        class="flex gap-x-3 items-center justify-center"
                                    >
                                        <button
                                            class="w-12 h-12 rounded-sm bg-green-600"
                                            onclick={sendRespondUraian.bind(
                                                null,
                                                true,
                                                true,
                                            )}>Benar</button
                                        >
                                        <button
                                            class="w-12 h-12 rounded-sm bg-red-600"
                                            onclick={sendRespondUraian.bind(
                                                null,
                                                false,
                                                true,
                                            )}>Salah</button
                                        >
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
            <div class="mt-4 border p-2">
                <p class="font-semibold">Sound Effect</p>
                <div class=" mt-4 flex flex-wrap items-center gap-x-2">
                    <button class="bg-green-400 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "benar")
                    }}>Benar</button>
                    <button class="bg-red-400 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "salah")
                    }}>Salah</button>
                    <button class="bg-amber-50 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "timeout")
                    }}>Timeout</button>
                    <button class="bg-amber-50 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "soal_lewatkataindah")
                    }}>Lewat Kata Indah Soal</button>
                    <button class="bg-amber-50 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "soal_semogalagucinta")
                    }}>Semoga Lagu Cinta Soal</button>
                    <button class="bg-amber-50 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "soal_egodanairmata")
                    }}>Ego dan Air mata Soal</button>
                    <button class="bg-amber-50 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "soal_teringatserusuaramu")
                    }}>Teringat seru Soal</button>



                    <button class="bg-amber-50 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "lewatkataindah")
                    }}>Lewat Kata Indah</button>
                    <button class="bg-amber-50 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "semogalagucinta")
                    }}>Semoga Lagu Cinta</button>
                    <button class="bg-amber-50 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "egodanairmata")
                    }}>Ego dan Air mata</button>
                    <button class="bg-amber-50 text-black p-2" onclick={() => {
                        socket.emit("playEffect", "teringatserusuaramu")
                    }}>Teringat seru</button>
                </div>
            </div>
        </div>
        <div class="border border-white w-8/12 space-y-2 p-3">
            <div class="border p-2">
                <p class="font-semibold">Paket Soal</p>
                <div class="mt-2 flex gap-2 flex-wrap">
                    {#each datapaketsoal as paket}
                        <button
                            class="{selectedPaket == paket
                                ? 'bg-green-400'
                                : 'bg-white'} text-black px-3 py-1 rounded"
                            onclick={() => selectPaket(paket)}
                        >
                            {paket}
                        </button>
                    {/each}
                </div>
            </div>
            <div class="border p-2">
                <p class="font-semibold">Preview</p>
                <div class="border px-2 py-1">
                    {#if soalList.length > 0}
                        <p>Tipe : {soalList[currentSoalIndex].type}</p>
                        <p>Soal : {soalList[currentSoalIndex].soal}</p>
                        {#if soalList[currentSoalIndex].type !== "uraian"}
                            <p>Opsi :</p>
                            <div class="flex flex-row flex-wrap gap-2 mt-2">
                                {#each soalList[currentSoalIndex].options as opsi, i}
                                    <div
                                        class="flex items-center gap-1 bg-white text-black px-2 py-1 rounded"
                                    >
                                        <span class="font-bold"
                                            >{String.fromCharCode(
                                                65 + i,
                                            )}.</span
                                        >
                                        <span>{opsi}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        <p>
                            Jawaban :
                            {soalList[currentSoalIndex].type === "uraian"
                                ? soalList[currentSoalIndex].jawaban
                                : String.fromCharCode(
                                      65 + soalList[currentSoalIndex].jawaban,
                                  )}
                        </p>
                    {:else}
                        <p>Belum ada soal</p>
                    {/if}
                </div>

                <div class="flex gap-x-4 my-2 items-center">
                    <p>Delay :</p>
                    <input
                        type="number"
                        bind:value={delay}
                        class="border-2 px-2 bg-white text-black rounded-md py-1"
                    />
                    <div class="mt-2 flex gap-4 items-center">
                        <label class="flex items-center gap-1">
                            <input type="checkbox" bind:checked={showDelay} />
                            <span>Show Delay</span>
                        </label>
                    </div>
                </div>
                <div class="flex gap-x-4 my-2 items-center">
                    <p>Timeout :</p>
                    <input
                        type="number"
                        bind:value={timeout}
                        class="px-2 border-2 bg-white text-black rounded-md py-1"
                    />
                    <div class="mt-2 flex gap-4 items-center">
                        <label class="flex items-center gap-1">
                            <input type="checkbox" bind:checked={showTimeout} />
                            <span>Show Timeout</span>
                        </label>
                    </div>
                </div>
                <div>
                    <button
                        class="bg-white text-black px-4 py-2"
                        onclick={() => {
                            if (currentSoalIndex > 0) currentSoalIndex--;
                        }}
                    >
                        Prev
                    </button>
                    <button
                        class="bg-white text-black px-4 py-2"
                        onclick={() => {
                            if (currentSoalIndex < soalList.length - 1)
                                currentSoalIndex++;
                        }}
                    >
                        Next
                    </button>

                    <button class="bg-pink-400 text-black px-4 py-2">
                        Shuffle
                    </button>
                    <button
                        class="bg-red-500 text-black mr-4 px-4 py-2"
                        onclick={handleClearSoal}
                    >
                        Clear Soal
                    </button>
                    {#if selectedPaket !== ""}
                        <button
                            class="bg-green-500 text-black px-4 py-2"
                            onclick={handleShowSoal}
                        >
                            SHOW
                        </button>
                    {/if}

                    {#if Object.keys(programSoal).length > 0}
                        <button
                            class="bg-teal-300 text-black px-4 py-2"
                            onclick={() => {
                                poinBenar = 0;
                                poinSalah = 0;
                                socket.emit("unshowProgramSoal");
                            }}
                        >
                            Unshow
                        </button>
                        <button
                            class="bg-blue-400 text-black px-4 py-2"
                            onclick={() => {
                                socket.emit("reqIsAnswered", {
                                    paket: programSoal.paket,
                                    index: programSoal.index,
                                });
                            }}
                        >
                            Mark Done
                        </button>
                        <button
                            class="bg-amber-700 text-black px-4 py-2"
                            onclick={() => {
                                socket.emit("startTimer");
                            }}
                        >
                            Start Timer
                        </button>
                    {/if}
                </div>
            </div>
            <div class="border p-2">
                <p class="font-semibold">Program</p>
                {#if programSoal?.countdown && !programSoal?.show}
                    <div class="bg-white text-black p-4 rounded text-center">
                        <p class="text-xl font-bold">
                            Soal akan ditampilkan dalam
                        </p>
                        <p class="text-5xl">{programSoal.countdown}</p>
                    </div>
                {:else if programSoal?.show}
                    <div class="bg-white text-black p-4 rounded">
                        <p>Soal : {programSoal.soal}</p>
                        <p>
                            Jawaban :
                            {programSoal.type === "uraian"
                                ? programSoal.jawaban
                                : String.fromCharCode(65 + programSoal.jawaban)}
                        </p>
                        {#if programSoal.timeout}
                            <p class="text-red-500 font-bold">
                                Timeout in: {programSoal.status === "timeout"
                                    ? "Waktu Habis"
                                    : programSoal.countdown}
                            </p>
                        {/if}
                        {#if programSoal.type !== "uraian"}
                            <div class="mt-2">
                                <p>Opsi :</p>
                                <div class="flex flex-row flex-wrap gap-2 mt-1">
                                    {#each programSoal.options as opsi, i}
                                        <div
                                            class="bg-gray-200 px-1 py-1 rounded"
                                        >
                                            <span class="font-bold"
                                                >{String.fromCharCode(
                                                    65 + i,
                                                )}.</span
                                            >
                                            <span>{opsi}</span>
                                            {#if i === programSoal.jawaban}
                                                <span
                                                    class="text-green-600 font-semibold ml-2"
                                                    >(Jawaban Benar)</span
                                                >
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <p class="text-gray-400 italic">
                        Menunggu soal ditampilkan...
                    </p>
                {/if}
            </div>
        </div>
    </div>
</div>
