<script>
    import { onMount } from "svelte";
    import { io } from "socket.io-client";

    let message = $state("");
    let highesid = $state(0);
    let nowId = $state(0);
    let datasoal = $state({});
    let datadevice = $state([]);
    let randomColors = $state([]);
    let socket;
    let showPopupGil = $state(false);
    let popupDevice = $state({});
    let showPopupJawaban = $state(false);
    let popupStatus = $state("");
    let popupJawabanBenar = $state("");
   // if (data.status === "correct") {
            //     var audio = new Audio("/correct.mp3");
            //     audio.play();
            // } else {
            //     var audio = new Audio("/wrong.mp3");
            //     audio.play();
            // }
   

    

    onMount(() => {
        randomColors = shuffle([...colorClasses]).slice(0, 4);
        console.log("Connecting to server...");
        socket = io("http://localhost:3000");

        socket.on("connect", () => {
            console.log("Connected to server");
            socket.emit("refreshDevices");
        });

        socket.on("jawab", (data) => {
            
         
            popupStatus = data.status;
            popupJawabanBenar = data.data.datasoal.jawaban;
            showPopupJawaban = true;
            setTimeout(() => (showPopupJawaban = false), 2500);
        });

        socket.on("selectDevice", (device) => {
            console.log("Selected device:", device);
            nowId = device;
            popupDevice = device;
            showPopupGil = true;
            setTimeout(() => (showPopupGil = false), 2500);
        });

        socket.on("refreshDevices", (devices) => {
            const max = devices.reduce((max, team) =>
                team.points > max.points ? team : max,
            );
            if (max.points != 0) {
                highesid = max.id;
            }
            datadevice = devices;
            console.log("Connected devices:", datadevice);
        });

        socket.on("showSoal", (data) => {
            console.log("Received question data:", data);
            datasoal = data;
        });

        return () => {
            socket.disconnect();
            console.log("Disconnected from server");
        };
    });
</script>

<div
    class="w-screen h-screen flex flex-col justify-between items-center bg-gray-100"
>
    {#if showPopupGil && popupDevice != 0}
        <div
            class="fixed inset-0 bg-amber-950/40 z-50 flex justify-center items-center"
        >
            <div
                class="w-full h-1/3 bg-amber-200 shadow-lg px-6 py-4 flex items-center gap-4"
            >
                <div class="flex items-center justify-center w-full">
                    <p
                        class="text-6xl text-center font-bold text-amber-600 font-ibm w-full"
                    >
                        Giliran {getdevicebyid(popupDevice).name} Menjawab....
                    </p>
                </div>
            </div>
        </div>
    {/if}
    {#if showPopupJawaban}
      <div class="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
        <div class="w-full h-1/3 shadow-lg px-6 py-4 flex flex-col items-center justify-center gap-4" class:bg-green-200={popupStatus === 'correct'}
             class:bg-red-200={popupStatus === 'incorrect'}>
         
          <p class="text-6xl font-bold font-ibm text-center " class:text-green-600={popupStatus === 'correct'}
             class:text-red-600={popupStatus === 'incorrect'}>
            {popupStatus === 'correct' ? 'Hore.. Jawaban Kamu benar' : 'Jawaban Kamu Salah! Yang benar :'+popupJawabanBenar+''}
          </p>
        </div>
      </div>
    {/if}
    <div class="p-4 flex justify-between items-center w-full">
        <div class="flex gap-x-4 items-center">
            <div
                class="bg-amber-300 w-fit shadow-[5px_8px_1px_2px_#1a202c] p-2 rounded-md border border-black"
            >
                <img src="/cerdas.png" alt="Logo" class="w-14" />
            </div>
            <p class="font-comforta text-lg font-[700]">
                Cerdas Cermat<br />Tapi Tidak
            </p>
        </div>
        <div
            class="bg-amber-300 w-fit shadow-[5px_8px_1px_2px_#1a202c] p-2 mr-6 rounded-md border border-black"
        >
            <p class="text-2xl">00:00</p>
        </div>
    </div>
    <div
        class=" relative p-4 w-8/12 h-4/12 bg-blue-200 border-2 border-black shadow-[8px_10px_1px_2px_#1a202c] rounded-md flex text-center justify-center items-center"
    >
        {#if nowId != 0}
            <div
                class="px-3 py-2 bg-fuchsia-300 border-2 flex gap-x-2 items-center border-black rounded-2xl absolute top-[-30px]"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-user-icon lucide-user"
                    ><path
                        d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
                    /><circle cx="12" cy="7" r="4" /></svg
                >
                <p class="text-3xl font-comforta font-bold">
                    {getdevicebyid(nowId).name}
                </p>
            </div>
        {/if}
        <p class="mb-2 text-6xl font-bold font-ibm text-center">
            {datasoal.soal}
        </p>
    </div>
    <div class="  p-4 w-8/12 flex gap-x-4 items-center justify-center mb-5">
        {#each datadevice as device, i (device.id)}
            <div
                class="flex text-black justify-center relative flex-col gap-y-3 items-center rounded-md border-2 min-h-52 min-w-52 p-2 {randomColors[
                    i
                ]}"
            >
                <img
                    src="/stars.png"
                    alt="Device Icon"
                    class="w-16 h-16 mb-2 absolute {highesid != device.id
                        ? 'hidden'
                        : ''} top-[-30px] left-[-20px]"
                />
                <p class="text-6xl font-comforta font-extrabold px-7">
                    {device.name}
                </p>
                <p class="text-4xl font-ibm font-semibold px-7">
                    ({device.points})
                </p>
            </div>
        {/each}
    </div>
</div>
