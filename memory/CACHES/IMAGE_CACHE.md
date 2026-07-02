# Image Cache

> Image storage and CDN caching for hotel and destination images.

---

## Purpose

Image cache stores:
- Hotel images
- Destination images
- Activity images
- Thumbnail versions

---

## Data Schema

### Image Record

```typescript
interface ImageRecord {
  image_id: string;
  
  // Source
  source_url: string;
  cdn_url?: string;
  
  // Metadata
  width: number;
  height: number;
  format: 'jpg' | 'png' | 'webp';
  size_bytes: number;
  
  // Context
  context: {
    type: 'hotel' | 'destination' | 'activity';
    item_id: string;
    caption?: string;
  };
  
  // Processing
  thumbnails: {
    small: string;   // 150x150
    medium: string;  // 300x300
    large: string;   // 600x600
  };
  
  // Cache info
  cached_at: number;
  expires_at: number;
}
```

**Key Pattern**: `cache:image:{image_id}`
**TTL**: 7 days
**Size**: ~2KB per record

---

### Image Set

```typescript
interface ImageSet {
  set_id: string;
  
  // Images
  images: ImageRecord[];
  
  // Context
  context: {
    type: 'hotel' | 'destination' | 'activity';
    item_id: string;
  };
  
  // Metadata
  total_count: number;
  last_updated: number;
}
```

**Key Pattern**: `cache:image:set:{set_id}`
**TTL**: 7 days
**Size**: ~10KB

---

## Access Patterns

### Store Image

```typescript
async function storeImage(record: ImageRecord): Promise<void> {
  await memory.set(
    `cache:image:${record.image_id}`,
    record,
    { ttl: 604800 }  // 7 days
  );
  
  // Update image set
  await memory.transaction(async (tx) => {
    const setId = `${record.context.type}:${record.context.item_id}`;
    const setKey = `cache:image:set:${setId}`;
    
    const set = await tx.get(setKey) || {
      set_id: setId,
      images: [],
      context: record.context,
      total_count: 0,
      last_updated: Date.now()
    };
    
    // Add or update image
    const existingIndex = set.images.findIndex(
      i => i.image_id === record.image_id
    );
    
    if (existingIndex >= 0) {
      set.images[existingIndex] = record;
    } else {
      set.images.push(record);
    }
    
    set.total_count = set.images.length;
    set.last_updated = Date.now();
    
    await tx.set(setKey, set, { ttl: 604800 });
  });
}

// Get image
async function getImage(imageId: string): Promise<ImageRecord | null> {
  return memory.get(`cache:image:${imageId}`);
}

// Get image set
async function getImageSet(
  type: string,
  itemId: string
): Promise<ImageSet | null> {
  return memory.get(`cache:image:set:${type}:${itemId}`);
}
```

---

## Cleanup

### Old Image Cleanup

```typescript
async function cleanupOldImages(): Promise<number> {
  const pattern = 'cache:image:*';
  let cursor = 0;
  let cleaned = 0;
  
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor, 'MATCH', pattern, 'COUNT', 100
    );
    cursor = nextCursor;
    
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -2) {
        await redis.del(key);
        cleaned++;
      }
    }
  } while (cursor !== 0);
  
  return cleaned;
}
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `image_cache.total_images` | Total cached images |
| `image_cache.total_sets` | Total image sets |
| `image_cache.cache_hit_rate` | Cache hit rate |
| `image_cache.total_size_mb` | Total cache size |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Large Cache | > 10GB used | Warning |
| Low Hit Rate | < 50% hit rate | Warning |
