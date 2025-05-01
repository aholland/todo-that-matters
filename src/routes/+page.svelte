<script lang="ts">
  import {secondsSinceEpoch} from '$lib/stores/clock';
  import {get} from 'svelte/store';
  import {Todo} from '$lib/todo';

  let todos = $state<Todo[]>([]);
  let newTodo = $state('');
  let newDeadlineInput = $state(0);
  let isManualDeadline = $state(false);

  let startSeconds = get(secondsSinceEpoch);
  let now = $derived($secondsSinceEpoch - startSeconds);
  let defaultDeadline = $derived((Math.round((now-3) / 10) * 10)+10);
  let newDeadline = $derived(isManualDeadline ? newDeadlineInput : defaultDeadline);

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

<style>
    :global(html), :global(body) {
        background-color: #1a1a1a; /* Dark grey background */
        margin: 0;
        padding: 0;
        height: 100%;
    }
</style>

<div class="max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col min-h-[calc(100vh-2.5rem)] mb-10">
    <img src="/matta-baby.png" alt="Solving the problems that matter most ™" class="mb-4 mx-auto rounded-lg" style="clip-path: inset(3px 0 0 0);"/>
    <h1 class="text-2xl font-bold text-gray-100 mb-4 flex justify-between items-center">
        TODO List™
        <span class="text-sm font-normal text-gray-400 min-w-[180px]">Current time: {now}s</span>
    </h1>
    <form onsubmit={addTodo} class="flex flex-wrap gap-2 mb-4">
        <div class="flex flex-1 gap-2 min-w-0">
            <input type="text" bind:value={newTodo} placeholder="Add task (with deadline)"
                   class="flex-1 p-2 border border-gray-600 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"/>
            <input
                    type="number"
                    bind:value={newDeadlineInput}
                    placeholder="Deadline (seconds)"
                    class="w-24 p-2 border border-gray-600 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                    step="10"
                    onfocus={onFocus}
                    onblur={onBlur}
            />
        </div>
        <div class="flex md:w-auto w-full md:justify-start justify-end">
            <button type="submit"
                    class="{newTodo.trim() ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'} px-4 py-2 text-gray-100 rounded"
                    disabled={!newTodo.trim()}>Add
            </button>
        </div>
    </form>
    {#snippet TodoItem(todo: Todo)}
        <li class="relative p-3 bg-gray-700 rounded-sm mb-2 shadow-sm list-none">
            <button class="absolute top-1 right-2 text-gray-400 hover:text-gray-300 text-lg font-bold leading-none"
                    onclick={() => removeTodo(todo.id)}>×
            </button>
            <div class="flex flex-col gap-1">
                <span class="text-gray-100 font-medium">{todo.text}</span>
                <label class="flex items-center gap-1 text-sm text-gray-400">
                    <input
                            type="checkbox"
                            checked={todo.matters}
                            class="h-4 w-4 accent-gray-400"
                            disabled={(!!todo.completed) || !!todo.missedDeadline}
                            onchange={(e) => {
                        todo.matters = e.target.checked;
                        todos = [...todos];
                      }}
                    />
                    Matters
                </label>
                <div class="flex gap-4 text-sm text-gray-400">
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
                <label class="flex items-center gap-1 text-sm text-gray-400">
                    <input
                            type="checkbox"
                            checked={!!todo.completed}
                            class="h-4 w-4 accent-gray-400"
                            disabled={todo.missedDeadline}
                            onchange={() => {
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
        <h2 class="text-lg font-semibold text-gray-300 mb-2">Matters</h2>
        {#each mattersTodos as todo (todo.id)}
            <div>
                {@render TodoItem(todo)}
            </div>
        {/each}

        <div class="flex-1"></div>

        <h2 class="text-lg font-semibold text-gray-300 mb-2">Success!</h2>
        {#each successTodos as todo (todo.id)}
            <div>
                {@render TodoItem(todo)}
            </div>
        {/each}

        <div class="flex-1"></div>

        <h2 class="text-lg font-semibold text-gray-300 mb-2">Trash heap of history</h2>
        {#each trashTodos as todo (todo.id)}
            <div>
                {@render TodoItem(todo)}
            </div>
        {/each}
    </div>
</div>