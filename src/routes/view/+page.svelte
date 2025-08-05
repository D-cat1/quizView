<script>
    import { onMount } from "svelte";
    import { io } from "socket.io-client";

    let message = $state("");
    let datasoal = $state({});
    let socket;

    function sendMessage() {
        if (socket && message.trim() !== "") {
            socket.emit("message", message);
            message = "";
        }
    }

    onMount(() => {
        console.log("Connecting to server...");
        socket = io("http://localhost:3000");

        socket.on("connect", () => {
            console.log("Connected to server");
        });

        socket.on("jawab", (data) => {
            if (data.status === "correct") {
                var audio = new Audio("/correct.mp3");
                audio.play();
            } else {
                var audio = new Audio("/wrong.mp3");
                audio.play();
            }
            console.log("Jawab from server:", data);
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
    class="w-screen h-screen flex flex-col items-center justify-center bg-gray-100"
>
    
    <div class="  p-4 w-8/12">
        <p class="mb-2 text-2xl font-bold text-center">{datasoal.soal}</p>
    </div>
</div>
