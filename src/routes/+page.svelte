<script lang="ts">
  import {secondsSinceEpoch} from '$lib/stores/clock';
  import {get} from 'svelte/store';
  import {Todo} from '$lib/todo';
  import {onMount} from 'svelte';
  import '../lib/styles/themes.css';

  let todos = $state<Todo[]>([]);
  let newTodo = $state('');
  let newDeadlineInput = $state(0);
  let isManualDeadline = $state(false);
  let isFruityTheme = $state(false); /* Theme toggle state */

  let startSeconds = get(secondsSinceEpoch);
  let now = $derived($secondsSinceEpoch - startSeconds);
  let defaultDeadline = $derived((Math.round((now-3) / 10) * 10)+10);
  let newDeadline = $derived(isManualDeadline ? newDeadlineInput : defaultDeadline);

  /* Ensure theme is applied on initial load */
  onMount(() => {
    if (isFruityTheme) {
      document.documentElement.classList.add('fruity-theme');
    } else {
      document.documentElement.classList.remove('fruity-theme');
    }
  });

  /* Update html class when theme changes */
  $effect(() => {
    console.log('Toggling theme to:', isFruityTheme ? 'fruity' : 'dark');
    if (isFruityTheme) {
      document.documentElement.classList.add('fruity-theme');
    } else {
      document.documentElement.classList.remove('fruity-theme');
    }
  });

  function addTodo(event: Event) {
    event.preventDefault();
    if (newTodo.trim()) {
      const todo = new Todo(newTodo.trim(), newDeadline);
      todos = [...todos, todo];
      newTodo = '';
      newDeadlineInput = defaultDeadline;
      isManualDeadline = false;
    }
  }

  function removeTodo(id: string) {
    todos = todos.filter(todo => todo.id !== id);
  }

  function onFocus() {
    isManualDeadline = true;
    newDeadlineInput = defaultDeadline;
  }

  function onBlur() {
    if (!newDeadlineInput) {
      isManualDeadline = false;
    }
  }

  $effect(() => {
    if (!isManualDeadline) {
      newDeadlineInput = defaultDeadline;
    }
  });

  $effect(() => {
    let updated = false;
    todos.forEach(todo => {
      if (todo.failsDeadlineCheck(now)) {
        updated = true;
      }
    });
    if (updated) {
      todos = [...todos]; // Trigger reactivity
    }
  });

  let mattersTodos = $derived(todos.filter(todo => todo.matters && !todo.missedDeadline && !todo.completed));
  let successTodos = $derived(todos.filter(todo => todo.completed));
  let trashTodos = $derived(todos.filter(todo => (!todo.matters || todo.missedDeadline) && !todo.completed));
</script>
<svelte:head>
    <link rel="preload" href="/matta-baby.png" as="image" />
    <link rel="preload" href="/fruity-baby.jpg" as="image" />
</svelte:head>
<style>
    :global(html), :global(body) {
        background-color: var(--background);
        margin: 0;
        padding: 0;
        height: 100%;
    }
</style>

<div class="max-w-md mx-auto mt-10 p-6 rounded-lg shadow-lg flex flex-col min-h-[calc(100vh-2.5rem)] mb-10" style="background-color: var(--container-bg);">
    <img src={isFruityTheme ? "/fruity-baby.jpg" : "/matta-baby.png"} alt="Solving the problems that matter most ™" class="mb-4 mx-auto rounded-lg"/>
    <h1 class="text-2xl font-bold mb-4 flex justify-between items-center" style="color: var(--text-primary);">
        TODO List™
        <span class="text-sm font-normal min-w-[180px]" style="color: var(--text-secondary);">Current time: {now}s</span>
    </h1>
    <div class="flex justify-end mb-4">
        <label class="flex items-center gap-1 text-sm" style="color: var(--text-secondary);">
            <input type="checkbox" bind:checked={isFruityTheme} class="h-4 w-4" style="accent-color: var(--accent);"/>
            Fruity Theme
        </label>
    </div>
    <form on:submit={addTodo} class="flex flex-wrap gap-2 mb-4">
        <div class="flex flex-1 gap-2 min-w-0">
            <input type="text" bind:value={newTodo} placeholder="Add task (with deadline)"
                   class="flex-1 p-2 border rounded focus:outline-none focus:ring-2" style="border-color: var(--border); background-color: var(--item-bg); color: var(--text-primary); --tw-ring-color: var(--accent);"/>
            <input
                    type="number"
                    bind:value={newDeadlineInput}
                    placeholder="Deadline (seconds)"
                    class="w-24 p-2 border rounded focus:outline-none focus:ring-2" style="border-color: var(--border); background-color: var(--item-bg); color: var(--text-primary); --tw-ring-color: var(--accent);"
                    step="10"
                    on:focus={onFocus}
                    on:blur={onBlur}
            />
        </div>
        <div class="flex md:w-auto w-full md:justify-start justify-end">
            <button type="submit"
                    class="{newTodo.trim() ? 'hover:bg-[var(--button-bg-hover)]' : 'hover:bg-[var(--button-bg)]'} px-4 py-2 rounded"
                    style="background-color: {newTodo.trim() ? 'var(--button-bg)' : 'var(--button-bg-disabled)'}; color: var(--text-primary);"
                    disabled={!newTodo.trim()}>Add
            </button>
        </div>
    </form>
    {#snippet TodoItem(todo: Todo)}
        <li class="relative p-3 rounded-sm mb-2 shadow-sm list-none" style="background-color: var(--item-bg);">
            <button class="absolute top-1 right-2 text-lg font-bold leading-none"
                    style="color: var(--text-secondary);"
                    on:mouseover={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    on:mouseout={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    on:click={() => removeTodo(todo.id)}>×
            </button>
            <div class="flex flex-col gap-1">
                <span class="font-medium" style="color: var(--text-primary);">{todo.text}</span>
                <label class="flex items-center gap-1 text-sm" style="color: var(--text-secondary);">
                    <input
                            type="checkbox"
                            checked={todo.matters}
                            class="h-4 w-4"
                            style="accent-color: var(--accent);"
                            disabled={(!!todo.completed) || !!todo.missedDeadline}
                            on:change={(e) => {
                        todo.matters = e.target.checked;
                        todos = [...todos];
                      }}
                    />
                    Matters
                </label>
                <div class="flex gap-4 text-sm" style="color: var(--text-secondary);">
                    <span>Expiry: {todo.deadline} sec</span>
                    {#if todo.completed}
                    <span>
                      Completed at: {todo.completed} sec
                    </span>
                    {:else }
                    <span>
                      Remaining:
                        {#if todo.deadline - now <= 0}
                        (expired)
                      {:else}
                        {todo.deadline - now} sec
                      {/if}
                    </span>
                    {/if}
                </div>
            </div>
            <div class="absolute bottom-3 right-3 {todo.completed ? 'hidden sm:block' : 'block'}">
                <label class="flex items-center gap-1 text-sm" style="color: var(--text-secondary);">
                    <input
                            type="checkbox"
                            checked={!!todo.completed}
                            class="h-4 w-4"
                            style="accent-color: var(--accent);"
                            disabled={todo.missedDeadline}
                            on:change={() => {
                        todo.markDone(now);
                        todos = [...todos];
                      }}
                    />
                    Done
                </label>
            </div>
        </li>
    {/snippet}

    <div class="flex-1 flex flex-col">
        <h2 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Matters</h2>
        {#each mattersTodos as todo (todo.id)}
            <div>
                {@render TodoItem(todo)}
            </div>
        {/each}

        <div class="flex-1"></div>

        <h2 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Success!</h2>
        {#each successTodos as todo (todo.id)}
            <div>
                {@render TodoItem(todo)}
            </div>
        {/each}

        <div class="flex-1"></div>

        <h2 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Trash heap of history</h2>
        {#each trashTodos as todo (todo.id)}
            <div>
                {@render TodoItem(todo)}
            </div>
        {/each}
    </div>
</div>