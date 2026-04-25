export function calculateTreeStats(node) {
  const stats = {
    totalFolders: 0,
    totalFiles: 0,
    parsedFiles: 0,
    failedFiles: 0,
    unsupportedFiles: 0,

    totalFunctions: 0,
    totalImports: 0,
    totalImportedItems: 0,
    usedImportedItems: 0,
    unusedImportedItems: 0,
    totalExports: 0,
    totalClasses: 0,
    totalApiRoutes: 0
  };

  function walk(currentNode) {
    if (!currentNode) return;

    if (currentNode.type === "folder") {
      stats.totalFolders += 1;
    }

    if (currentNode.type === "file") {
      stats.totalFiles += 1;

      const parseResult = currentNode.parseResult;

      if (parseResult?.parseSuccess) {
        stats.parsedFiles += 1;

        const summary = parseResult.summary;

        stats.totalFunctions += summary?.functions?.totalFunctions || 0;
        stats.totalImports += summary?.imports?.totalImportedModules || 0;
        stats.totalImportedItems += summary?.imports?.totalImportedItems || 0;
        stats.usedImportedItems += summary?.imports?.usedImportedItems || 0;
        stats.unusedImportedItems += summary?.imports?.unusedImportedItems || 0;
        stats.totalExports += summary?.exports?.totalExports || 0;
        stats.totalClasses += summary?.classes?.totalClasses || 0;
        stats.totalApiRoutes += summary?.apiRoutes?.totalRoutes || 0;
      } else if (parseResult?.reason === "Unsupported file type") {
        stats.unsupportedFiles += 1;
      } else {
        stats.failedFiles += 1;
      }
    }

    if (currentNode.children && Array.isArray(currentNode.children)) {
      currentNode.children.forEach(walk);
    }
  }

  walk(node);

  return stats;
}