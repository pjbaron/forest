
    // adjList entries match node indices N, adjList[N] are lists of neighbouring node indices
    function findMinimalLoops(adjList)
    {
        const loops = [];
        const visited = new Set();
    
        function dfs(node, path)
        {
            visited.add(node);
    
            for (let neighbor of adjList[node])
            {
                if (path.length > 2 && neighbor === path[0])
                {
                    // We found a closed loop (don't add neighbor, the closure is implied)
                    loops.push([...path]);
                }
                else if (!visited.has(neighbor))
                {
                    // Continue the DFS with the neighbor
                    dfs(neighbor, [...path, neighbor]);
                }
            }
    
            visited.delete(node);
        }
    
        for (let i = 0; i < adjList.length; i++)
        {
            dfs(i, [i]);
        }

        const minimalUniqueLoops = [];
        for (let i = 0; i < loops.length; i++)
        {
            const loop = loops[i];
            let isMinimalAndUnique = true;
            for (let j = 0; j < minimalUniqueLoops.length; j++)
            {
                if (isSubarray(loop, minimalUniqueLoops[j]))
                {
                    // loop is a subarray of a longer loop, so it's not minimal
                    isMinimalAndUnique = false;
                    break;
                }
                else if (isSameLoop(loop, minimalUniqueLoops[j]))
                {
                    // loop is the same loop starting at a different index
                    isMinimalAndUnique = false;
                    break;
                }
            }
            if (isMinimalAndUnique)
            {
                minimalUniqueLoops.push(loop);
            }
        }
        
        return minimalUniqueLoops;
    }
    
    // Helper function to check if one array is a subarray of another
    function isSubarray(sub, arr)
    {
        for (let i = 0; i < arr.length - sub.length + 1; i++)
        {
            if (arr.slice(i, i + sub.length).every((x, j) => x === sub[j]))
            {
                return true;
            }
        }
        return false;
    }

    // Helper function to check if loop1 contains all the same points as loop2 (and only those points)
    function isSameLoop(loop1, loop2)
    {
        const l = loop1.length;
        if (l != loop2.length)
            return false;
        for(let i = 0; i < l; i++)
            if (loop2.indexOf(loop1[i]) == -1)
                return false;
        return true;
    }

