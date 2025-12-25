<script setup lang="js">

</script>

<template>
    <div 
      class="p-3 bg-yellow-300 rounded-xl shadow-[0px_2px_0px_2px_rgba(255,0,0,1)] shadow-yellow-600"
    >
        <!-- Content card -->
        <div 
            class="relative p-1 title-text bg-blue-700 rounded-lg shadow-[0px_0.5px_0px_2px_rgba(255,0,0,1)] shadow-blue-800 drop-shadow-[0px_2px_0px_rgba(255,0,0,1)] drop-shadow-yellow-200"
            style=""
        >
            <!-- Checkers background -->
            <div class="absolute inset-0 bg-center rounded-lg"
            style="background-image:
                linear-gradient(135deg, rgba(255,255,255,.05) 25%, transparent 25%),
                linear-gradient(225deg, rgba(255,255,255,.05) 25%, transparent 25%),
                linear-gradient(315deg, rgba(255,255,255,.05) 25%, transparent 25%),
                linear-gradient(45deg, rgba(255,255,255,.05) 25%, transparent 25%);
                background-size: 50px 50px;"
            >
            </div>

            <!-- Content -->
            <div class="flex flex-col items-center">
                <slot />
            </div>

        </div>
    </div>
</template>
