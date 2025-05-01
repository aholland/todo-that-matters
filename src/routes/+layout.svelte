<script lang="ts">
	import '../app.css';
    import { activateClockStore, secondsSinceEpoch } from "$lib/stores/clock";
    import {onMount} from "svelte";

    let { children } = $props();
    onMount(()=>{
      activateClockStore();
    })
</script>
{@render children()}
