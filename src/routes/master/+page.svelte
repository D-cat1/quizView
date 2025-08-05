<script>
    import { onMount } from "svelte";
    import { io } from "socket.io-client";

    let status = $state("");
    let socket;
    let datadevice = $state([]);
    let datasoal = $state({});
    let selectedDevice = $state("");

    function RefreshDevices() {
        console.log("Refreshing connected devices...");
        socket.emit("refreshDevices");
    }

    function RefreshSoal() {
        console.log("Refreshing questions...");
        socket.emit("getsoal");
    }

    function clearSoal() {
        console.log("Refreshing questions...");
        socket.emit("clearSoal");
    }

    function selectDevice(device) {
        console.log("Selected device:", device);
        selectedDevice = device;
        // Implement any additional logic for selecting a device
    }

    onMount(() => {
        status = "connecting";
        console.log("Connecting to server...");
        socket = io("http://localhost:3000");

        socket.on("connect", () => {
            status = "connected";
            console.log("Connected to server");
            socket.emit("refreshDevices");
        });

        socket.on("showSoal", (data) => {
            console.log("Received question data:", data);
            datasoal = data;
        });

        socket.on("disconnect", () => {
            status = "disconnected";
        });

        socket.on("refreshDevices", (devices) => {
            datadevice = devices;
            console.log("Connected devices:", datadevice);
        });

        return () => {
            socket.disconnect();
            console.log("Disconnected from server");
        };
    });
</script>

<div class="h-screen w-screen bg-black min-h-screen">
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
    <div class="text-white px-2 mt-4 flex">
        <div class="border border-white w-4/12 space-y-2 p-3">
            <div class="border border-white p-2">
                <p>Client yang terhubung :</p>
                <div class="flex gap-x-2">
                    {#each datadevice as device}
                        <button
                            class="flex {selectedDevice == device
                                ? 'bg-green-400'
                                : 'bg-white'} text-black justify-between items-center p-2"
                            onclick={() => {
                                selectDevice(device);
                            }}
                        >
                            <span>{device}</span>
                        </button>
                    {/each}
                </div>
                <div class="mt-4 space-x-2">
                    <button class="bg-blue-500 p-1" onclick={RefreshDevices}>
                        Refresh
                    </button>
                    <button
                        class="bg-red-500 p-1"
                        onclick={() => {
                            selectDevice(""); // Reset selected device
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div class="border border-white w-full space-y-2 p-3">
                <p>Statistik Tim</p>
            </div>
        </div>
        <div class="border border-white w-8/12 space-y-2 p-3">
            <p>Random Soal : {datasoal.soal}</p>
            <p>Answer : {datasoal.jawaban}</p>
            <div>
                <button
                    class="bg-white text-black px-4 py-2"
                    onclick={RefreshSoal}
                >
                    Refresh Soal
                </button>
                <button
                    class="bg-red-500 text-black px-4 py-2"
                    onclick={clearSoal}
                >
                    Clear Soal
                </button>

                <div class="mt-4 border p-2">
                    <div class="flex gap-x-4 my-2 items-center">
                        <p>Timeout :</p>
                        <input
                            class="border-2 bg-white text-black rounded-md py-1"
                        />
                    </div>
                    <div class="flex gap-x-4">
                        <div>
                            <p>Poin Utama:</p>
                            <input
                                type="number"
                                class="border-2 bg-white text-black p-2 rounded-md"
                                placeholder="Masukkan poin..."
                            />
                        </div>

                        <div>
                            <p>Poin Lemparan:</p>
                            <input
                                type="number"
                                class="border-2 bg-white text-black p-2 rounded-md"
                                placeholder="Masukkan poin..."
                            />
                        </div>
                    </div>
                    <div class="flex gap-x-4">
                        <div>
                            <p>Minus Utama:</p>
                            <input
                                type="number"
                                class="border-2 bg-white text-black p-2 rounded-md"
                                placeholder="Masukkan poin..."
                            />
                        </div>

                        <div>
                            <p>Minus Lemparan:</p>
                            <input
                                type="number"
                                class="border-2 bg-white text-black p-2 rounded-md"
                                placeholder="Masukkan poin..."
                            />
                        </div>
                    </div>
                    <button
                        class="bg-blue-500 mt-4 text-white px-4 py-2 rounded-sm"
                        onclick={() => {
                            // Implement logic to save settings
                            console.log("Settings saved");
                        }}
                    >
                        Simpan
                    </button>
                </div>

                <div class="mt-4 border p-2">
                    <p>Answer Pilihan Ganda</p>
                    <div class="flex gap-x-2 items-center">
                        <p>Mode :</p>
                        <div class="flex gap-x-4 my-2 items-center">
                            <div>
                                <input
                                    type="radio"
                                    id="utama2"
                                    name="mode"
                                    value="utama"
                                    checked
                                />
                                <label for="utama2">Utama</label>
                            </div>

                            <div>
                                <input
                                    type="radio"
                                    id="lempar2"
                                    name="mode"
                                    value="lempar"
                                />
                                <label for="lempar2">Lemparan</label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button class="w-14 h-14 rounded-sm bg-red-600"
                            >A</button
                        >
                        <button class="w-14 h-14 rounded-sm bg-blue-600"
                            >B</button
                        >
                        <button class="w-14 h-14 rounded-sm bg-purple-600"
                            >C</button
                        >
                        <button class="w-14 h-14 rounded-sm bg-amber-400"
                            >D</button
                        >
                    </div>
                </div>

                <div class="mt-4 border p-2">
                    <p>Answer Uraian</p>
                    <div class="flex gap-x-2 items-center">
                        <p>Mode :</p>
                        <div class="flex gap-x-4 my-2 items-center">
                            <div>
                                <input
                                    type="radio"
                                    id="utama"
                                    name="mode_ur"
                                    value="utamas"
                                    checked
                                />
                                <label for="utama">Utama</label>
                            </div>

                            <div>
                                <input
                                    type="radio"
                                    id="lempar"
                                    name="mode_ur"
                                    value="lempars"
                                />
                                <label for="lempar">Lemparan</label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button class="w-20 h-14 rounded-sm bg-green-600"
                            >Benar</button
                        >
                        <button class="w-20 h-14 rounded-sm bg-red-600"
                            >Salah</button
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
