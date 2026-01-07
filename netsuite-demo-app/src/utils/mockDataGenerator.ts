
export const generateMockData = (count = 50) => {
    const types = ['Item Fulfillment', 'Item Receipt', 'Inventory Transfer', 'Work Order', 'Assembly Build'];
    const items = ['Widget A', 'Widget B', 'Widget C', 'Component X', 'Component Y', 'Assembly Z'];

    const transactions = [];
    const now = new Date();

    // Helper to get random integer
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Helper for random date in last 30 days
    const randomDate = () => {
        const date = new Date(now);
        date.setDate(date.getDate() - randomInt(0, 30));
        return date.toISOString().split('T')[0];
    };

    // Generate base data
    for (let i = 0; i < count; i++) {
        transactions.push({
            id: `TXN${1000 + i}`,
            type: types[randomInt(0, types.length - 1)],
            date: randomDate(),
            lotNumber: `LOT-2024-${randomInt(100, 999)}`,
            unitNumber: `UNIT-${randomInt(1000, 9999)}`,
            item: items[randomInt(0, items.length - 1)],
            qty: randomInt(1, 100),
            authorized: Math.random() > 0.1 // 90% authorized
        });
    }

    // Inject strict duplicates (same lot/unit different transaction)
    // We'll take the first few transactions and create "clones" with different IDs but same lot/unit
    // Inject specific DUPLICATE LOT scenarios (same lot, different unit)
    const duplicateLotCount = 3;
    for (let i = 0; i < duplicateLotCount; i++) {
        const original = transactions[i];
        transactions.push({
            ...original,
            id: `DUP-LOT-${original.id}`,
            unitNumber: `UNIT-${randomInt(1000, 9999)}`, // Different unit
            qty: original.qty + randomInt(1, 5),
            date: randomDate(),
        });
    }

    // Inject specific DUPLICATE UNIT scenarios (same unit, different lot)
    const duplicateUnitCount = 3;
    for (let i = duplicateLotCount; i < duplicateLotCount + duplicateUnitCount; i++) {
        const original = transactions[i];
        transactions.push({
            ...original,
            id: `DUP-UNIT-${original.id}`,
            lotNumber: `LOT-2024-${randomInt(100, 999)}`, // Different lot
            qty: original.qty + randomInt(1, 5),
            date: randomDate(),
        });
    }

    // Inject STRICT duplicates (exact same lot and unit)
    const strictDuplicateCount = 3;
    for (let i = duplicateLotCount + duplicateUnitCount; i < duplicateLotCount + duplicateUnitCount + strictDuplicateCount; i++) {
        const original = transactions[i];
        transactions.push({
            ...original,
            id: `DUP-EXACT-${original.id}`,
            qty: original.qty, // Same qty
            date: original.date, // Same date
        });
    }

    // Ensure some specific "known" fields from config are present if needed, 
    // but for now random generation covering a range is good.

    // Shuffle the array
    return transactions.sort(() => Math.random() - 0.5);
};
