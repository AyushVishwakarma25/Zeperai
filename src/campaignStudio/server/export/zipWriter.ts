/**
 * Zero-dependency PKZIP (.zip) buffer generator using Node.js built-in zlib.
 * Generates standards-compliant, compressed ZIP archives that open on Windows, macOS, and Linux.
 * Includes support for ZIP64 extensions when archives or entry counts exceed 32-bit limits.
 */

import zlib from 'node:zlib';

// Pre-computed CRC32 lookup table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

export function computeCrc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  path: string;
  data: Buffer | string;
}

export interface ZipWriterOptions {
  forceZip64?: boolean;
}

export class SimpleZipBuilder {
  private entries: Array<{
    name: string;
    nameBuf: Buffer;
    compressedData: Buffer;
    uncompressedSize: number;
    compressedSize: number;
    compressionMethod: number;
    crc: number;
    offset: number;
  }> = [];

  private localHeaders: Buffer[] = [];
  private currentOffset = 0;

  public addFile(filePath: string, content: Buffer | string): void {
    const rawData = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
    const cleanPath = filePath.replace(/\\/g, '/');
    const nameBuf = Buffer.from(cleanPath, 'utf-8');

    const crc = computeCrc32(rawData);
    // Deflate raw compression
    let compressedData: Buffer;
    let compressionMethod = 8; // Deflated
    try {
      compressedData = zlib.deflateRawSync(rawData);
    } catch {
      // Fallback to uncompressed (Store)
      compressedData = rawData;
      compressionMethod = 0;
    }

    const uncompressedSize = rawData.length;
    const compressedSize = compressedData.length;
    const offset = this.currentOffset;

    // Build Local File Header (30 bytes + nameBuf.length)
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
    localHeader.writeUInt16LE(20, 4); // Version needed (2.0)
    localHeader.writeUInt16LE(0x0800, 6); // Flags: UTF-8 filename
    localHeader.writeUInt16LE(compressionMethod, 8); // Compression method
    localHeader.writeUInt16LE(0, 10); // Time (00:00)
    localHeader.writeUInt16LE(0x5421, 12); // Date (2026-01-01)
    localHeader.writeUInt32LE(crc, 14); // CRC-32
    localHeader.writeUInt32LE(compressedSize >= 0xffffffff ? 0xffffffff : compressedSize, 18); // Compressed size
    localHeader.writeUInt32LE(uncompressedSize >= 0xffffffff ? 0xffffffff : uncompressedSize, 22); // Uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26); // Filename length
    localHeader.writeUInt16LE(0, 28); // Extra field length
    nameBuf.copy(localHeader, 30);

    this.localHeaders.push(localHeader, compressedData);
    this.currentOffset += localHeader.length + compressedData.length;

    this.entries.push({
      name: cleanPath,
      nameBuf,
      compressedData,
      uncompressedSize,
      compressedSize,
      compressionMethod,
      crc,
      offset,
    });
  }

  public getEntryNames(): string[] {
    return this.entries.map((e) => e.name);
  }

  public toBuffer(options?: ZipWriterOptions): Buffer {
    const centralDirectoryParts: Buffer[] = [];
    let centralDirectorySize = 0;

    // Build Central Directory Headers
    for (const entry of this.entries) {
      const cdHeader = Buffer.alloc(46 + entry.nameBuf.length);
      cdHeader.writeUInt32LE(0x02014b50, 0); // Central directory file header signature
      cdHeader.writeUInt16LE(20, 4); // Version made by
      cdHeader.writeUInt16LE(20, 6); // Version needed
      cdHeader.writeUInt16LE(0x0800, 8); // UTF-8
      cdHeader.writeUInt16LE(entry.compressionMethod, 10); // Exact compression method used
      cdHeader.writeUInt16LE(0, 12); // Time
      cdHeader.writeUInt16LE(0x5421, 14); // Date
      cdHeader.writeUInt32LE(entry.crc, 16);
      cdHeader.writeUInt32LE(entry.compressedSize >= 0xffffffff ? 0xffffffff : entry.compressedSize, 20);
      cdHeader.writeUInt32LE(entry.uncompressedSize >= 0xffffffff ? 0xffffffff : entry.uncompressedSize, 24);
      cdHeader.writeUInt16LE(entry.nameBuf.length, 28);
      cdHeader.writeUInt16LE(0, 30); // Extra field length
      cdHeader.writeUInt16LE(0, 32); // Comment length
      cdHeader.writeUInt16LE(0, 34); // Disk number start
      cdHeader.writeUInt16LE(0, 36); // Internal file attributes
      cdHeader.writeUInt32LE(0, 38); // External file attributes
      cdHeader.writeUInt32LE(entry.offset >= 0xffffffff ? 0xffffffff : entry.offset, 42); // Relative offset of local header
      entry.nameBuf.copy(cdHeader, 46);

      centralDirectoryParts.push(cdHeader);
      centralDirectorySize += cdHeader.length;
    }

    const centralDirectoryOffset = this.currentOffset;

    const requiresZip64 =
      options?.forceZip64 ||
      this.entries.length >= 0xffff ||
      centralDirectorySize >= 0xffffffff ||
      centralDirectoryOffset >= 0xffffffff;

    const outputBuffers: Buffer[] = [...this.localHeaders, ...centralDirectoryParts];

    if (requiresZip64) {
      // 1. ZIP64 End of Central Directory Record (56 bytes)
      const zip64Eocd = Buffer.alloc(56);
      zip64Eocd.writeUInt32LE(0x06064b50, 0); // ZIP64 EOCD signature
      zip64Eocd.writeBigUInt64LE(44n, 4); // Size of zip64 end of central dir record
      zip64Eocd.writeUInt16LE(45, 12); // Version made by (4.5)
      zip64Eocd.writeUInt16LE(45, 14); // Version needed to extract (4.5)
      zip64Eocd.writeUInt32LE(0, 16); // Number of this disk
      zip64Eocd.writeUInt32LE(0, 20); // Disk where central directory starts
      zip64Eocd.writeBigUInt64LE(BigInt(this.entries.length), 24); // Number of central directory records on this disk
      zip64Eocd.writeBigUInt64LE(BigInt(this.entries.length), 32); // Total number of central directory records
      zip64Eocd.writeBigUInt64LE(BigInt(centralDirectorySize), 40); // Size of central directory
      zip64Eocd.writeBigUInt64LE(BigInt(centralDirectoryOffset), 48); // Offset of central directory

      // 2. ZIP64 End of Central Directory Locator (20 bytes)
      const zip64Locator = Buffer.alloc(20);
      const zip64EocdOffset = centralDirectoryOffset + centralDirectorySize;
      zip64Locator.writeUInt32LE(0x07064b50, 0); // ZIP64 EOCD Locator signature
      zip64Locator.writeUInt32LE(0, 4); // Number of the disk with the start of the zip64 end of central dir
      zip64Locator.writeBigUInt64LE(BigInt(zip64EocdOffset), 8); // Relative offset of the zip64 EOCD record
      zip64Locator.writeUInt32LE(1, 16); // Total number of disks

      outputBuffers.push(zip64Eocd, zip64Locator);
    }

    // Standard End of Central Directory Record (22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
    eocd.writeUInt16LE(0, 4); // Number of this disk
    eocd.writeUInt16LE(0, 6); // Disk where central directory starts
    eocd.writeUInt16LE(this.entries.length >= 0xffff ? 0xffff : this.entries.length, 8); // Central directory records on this disk
    eocd.writeUInt16LE(this.entries.length >= 0xffff ? 0xffff : this.entries.length, 10); // Total central directory records
    eocd.writeUInt32LE(centralDirectorySize >= 0xffffffff ? 0xffffffff : centralDirectorySize, 12); // Size of central directory
    eocd.writeUInt32LE(centralDirectoryOffset >= 0xffffffff ? 0xffffffff : centralDirectoryOffset, 16); // Offset of central directory
    eocd.writeUInt16LE(0, 20); // Comment length

    outputBuffers.push(eocd);

    return Buffer.concat(outputBuffers);
  }
}
