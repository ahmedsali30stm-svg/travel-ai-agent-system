# Serialization

> Data format handling for storage and transfer between components.

---

## Purpose

Serialization handles:
- Data encoding/decoding
- Compression
- Format conversion
- Schema validation

---

## Supported Formats

### 1. JSON (Default)

```typescript
class JSONSerializer implements Serializer {
  name = 'json';
  
  serialize(data: any): string {
    return JSON.stringify(data);
  }
  
  deserialize(data: string): any {
    return JSON.parse(data);
  }
  
  compress(data: string): string {
    // No compression by default
    return data;
  }
  
  decompress(data: string): string {
    return data;
  }
}
```

### 2. MessagePack

```typescript
import msgpack from 'msgpack-lite';

class MessagePackSerializer implements Serializer {
  name = 'msgpack';
  
  serialize(data: any): Buffer {
    return msgpack.encode(data);
  }
  
  deserialize(data: Buffer): any {
    return msgpack.decode(data);
  }
  
  compress(data: Buffer): Buffer {
    return data;  // MessagePack is already compact
  }
  
  decompress(data: Buffer): any {
    return msgpack.decode(data);
  }
}
```

### 3. Protocol Buffers

```typescript
import protobuf from 'protobufjs';

class ProtobufSerializer implements Serializer {
  name = 'protobuf';
  private schema: protobuf.Type;
  
  constructor(schemaPath: string) {
    this.schema = protobuf.loadSync(schemaPath);
  }
  
  serialize(data: any): Buffer {
    const message = this.schema.create(data);
    return this.schema.encode(message).finish();
  }
  
  deserialize(data: Buffer): any {
    return this.schema.decode(data);
  }
}
```

---

## Compression

### Compression Strategies

| Strategy | Ratio | Speed | Use Case |
|----------|-------|-------|----------|
| none | 1.0 | Fast | Small data |
| gzip | 3.0 | Medium | General |
| lz4 | 2.5 | Fast | Real-time |
| zstd | 3.5 | Medium | Archive |

### Implementation

```typescript
import zlib from 'zlib';
import { createHash } from 'crypto';

class Compressor {
  static async compress(
    data: Buffer,
    strategy: CompressionStrategy = 'lz4'
  ): Promise<CompressedData> {
    let compressed: Buffer;
    
    switch (strategy) {
      case 'gzip':
        compressed = await gzipAsync(data);
        break;
      case 'lz4':
        compressed = lz4.compress(data);
        break;
      case 'zstd':
        compressed = await zstd.compress(data);
        break;
      default:
        compressed = data;
    }
    
    return {
      data: compressed,
      originalSize: data.length,
      compressedSize: compressed.length,
      strategy,
      checksum: createHash('sha256').update(data).digest('hex')
    };
  }
  
  static async decompress(compressed: CompressedData): Promise<Buffer> {
    let decompressed: Buffer;
    
    switch (compressed.strategy) {
      case 'gzip':
        decompressed = await gunzipAsync(compressed.data);
        break;
      case 'lz4':
        decompressed = lz4.decompress(compressed.data);
        break;
      case 'zstd':
        decompressed = await zstd.decompress(compressed.data);
        break;
      default:
        decompressed = compressed.data;
    }
    
    // Verify checksum
    const checksum = createHash('sha256').update(decompressed).digest('hex');
    if (checksum !== compressed.checksum) {
      throw new Error('Checksum mismatch - data corrupted');
    }
    
    return decompressed;
  }
}
```

---

## Schema Validation

### Validation Pipeline

```typescript
interface SchemaValidator {
  validate(data: any, schema: Schema): ValidationResult;
}

class AjvValidator implements SchemaValidator {
  private ajv: Ajv.Ajv;
  
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
  }
  
  validate(data: any, schema: Schema): ValidationResult {
    const valid = this.ajv.validate(schema, data);
    
    return {
      valid: valid as boolean,
      errors: this.ajv.errors || [],
      data
    };
  }
}

// Usage
const validator = new AjvValidator();
const result = validator.validate(sessionData, sessionSchema);

if (!result.valid) {
  throw new ValidationError('Invalid session data', result.errors);
}
```

---

## Type Mapping

### TypeScript to JSON Schema

```typescript
interface TypeMapping {
  string: { type: 'string' };
  number: { type: 'number' };
  boolean: { type: 'boolean' };
  array: { type: 'array' };
  object: { type: 'object' };
  Date: { type: 'string', format: 'date-time' };
  Buffer: { type: 'string', format: 'binary' };
}

function generateSchema<T>(): Schema {
  // Runtime schema generation from TypeScript types
  return jsonSchemaGenerator.generate<T>();
}
```

---

## Memory-Specific Serialization

### Cache Serialization

```typescript
class CacheSerializer {
  static serialize(cacheEntry: CacheEntry): string {
    return JSON.stringify({
      ...cacheEntry,
      _serialized_at: Date.now(),
      _checksum: this.calculateChecksum(cacheEntry)
    });
  }
  
  static deserialize(data: string): CacheEntry {
    const entry = JSON.parse(data);
    
    // Verify checksum
    const checksum = this.calculateChecksum(entry);
    if (checksum !== entry._checksum) {
      throw new Error('Cache entry corrupted');
    }
    
    return entry;
  }
  
  private static calculateChecksum(entry: any): string {
    const { _checksum, ...rest } = entry;
    return createHash('sha256')
      .update(JSON.stringify(rest))
      .digest('hex');
  }
}
```

### Binary Data

```typescript
class BinarySerializer {
  static serializeImage(image: ImageData): Buffer {
    // Convert to binary format
    return Buffer.from([
      ...uint32ToBytes(image.width),
      ...uint32ToBytes(image.height),
      ...image.data
    ]);
  }
  
  static deserializeImage(data: Buffer): ImageData {
    return {
      width: bytesToUint32(data.slice(0, 4)),
      height: bytesToUint32(data.slice(4, 8)),
      data: Array.from(data.slice(8))
    };
  }
}
```

---

## Monitoring

### Metrics

| Metric | Description |
|--------|-------------|
| `serialization.operations` | Total serialize/deserialize ops |
| `serialization.errors` | Serialization errors |
| `serialization.avg_time` | Avg serialization time |
| `serialization.compression_ratio` | Avg compression ratio |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | > 1% errors | Warning |
| Slow Serialization | > 10ms avg | Warning |
| Corrupted Data | Checksum mismatch | Critical |
