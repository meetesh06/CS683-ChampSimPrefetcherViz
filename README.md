# Mean Viz

This is a simple tool to see what your prefetcher is doing, I made it last night and will probably be live only for a few hours before the deadline; maybe it will be useful for some other batch of students :|

## Integration with champsim

1. Add meamviz.h to inc directory.
2. In main.cc add the following include directive.
```
#include "meamviz.h"
MeamViz logg("logg.csv");
```
3. In your favourite prefetcher, my_prefetcher.cc add the following 
```
// ...Header
#include "meamviz.h"
extern MeamViz logg;
// ...

void CACHE::prefetcher_cycle_operate() {
    // ...
    if (success) {
        logg.logCachePrefetchEvent(current_cycle, NAME, (pf_address >> LOG2_BLOCK_SIZE));
        // ...
    }
    //...
}

uint32_t CACHE::prefetcher_cache_operate(uint64_t addr, uint64_t ip, uint8_t cache_hit, uint8_t type, uint32_t metadata_in) {
    // ...
    logg.logCacheOperateEvent(
        current_cycle,
        NAME,
        (addr >> LOG2_BLOCK_SIZE), ip, cache_hit, type
    );
    //...
}
```

Now with each run, a logg.csv will get created which you can directly use with the viz.
