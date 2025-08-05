<script>
    import { onMount } from "svelte";
    import { io } from "socket.io-client";

    let message = $state("True");
    let mode = $state("pilihan");
    let status = $state("");
    let socket;
    let randomColors = $state([]);
    let { data } = $props();

    function sendAnswer(answer) {
        if (socket && answer.trim() !== "") {
            socket.emit("sendJawab", answer);
        }
    }

    const colorClasses = [
        "bg-blue-500",
        "bg-green-500",
        "bg-pink-500",
        "bg-yellow-500",
        "bg-purple-500",
        "bg-red-500",
        "bg-indigo-500",
        "bg-teal-500"
    ];

    
    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
       
        while (currentIndex !== 0) {
            
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
          
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    onMount(() => {
        randomColors = shuffle([...colorClasses]).slice(0, 4);
        status = "connecting";
        console.log("Connecting to server...");
        socket = io("http://localhost:3000");

        socket.on("connect", () => {
            status = "connected";
            console.log("Connected to server");
            socket.emit("refreshDevices");
        });

        socket.on("disconnect", () => {
            status = "disconnected";
        });
        

        socket.on("requestDevices", () => {
            console.log("Requesting devices for client:");
            socket.emit("requestDevices", data.id);
        });

        socket.on("message", (data) => {
            console.log("Message from server:", data);
        });

        return () => {
            socket.disconnect();
            console.log("Disconnected from server");
        };
    });
</script>

<div class="h-screen w-screen bg-black flex flex-col">
    <div class="w-full px-4 py-3 flex justify-between">
        <h2 class="text-white text-xl font-bold">{data.id}</h2>
        {#if status === "connected"}
            <div class="w-5 h-5 rounded-full bg-green-500"></div>
        {:else if status === "disconnected"}
            <div class="w-5 h-5 rounded-full bg-red-600"></div>
        {:else}
            <div class="w-5 h-5 rounded-full bg-yellow-400"></div>
        {/if}
    </div>
    <div
        class="w-full flex-1 flex flex-wrap justify-center gap-3 bg-white/20 items-center text-white border text-4xl rounded-t-2xl border-white/45 overflow-auto"
    >
        {#if mode === "waiting"}
            <h2>Menunggu Giliran Menjawab...</h2>
        {:else if mode === "pilihan"}
            {#each ["A", "B", "C", "D"] as option, i (option)}
                <button
                    class={`w-80 h-80  text-white px-4 py-2 rounded-md text-4xl  ${randomColors[i]}`}
                    onclick={() => sendAnswer(option)}
                >
                    {option}
                </button>
            {/each}
        {:else if mode === "uraian"}
           <input class="border-2 bg-white text-black p-2 rounded-md" placeholder="Jawab disini.."/>
           <button
                class="bg-blue-500 text-white px-4 py-3 rounded-md text-2xl"
                onclick={() => sendAnswer(message)}
            >
                Kirim Jawaban
            </button>
        {/if}
    </div>
</div>
