"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestEvents = suggestEvents;
const date_fns_1 = require("date-fns");
function suggestEvents(photos) {
    // Filter photos that have date information
    const photosWithDates = photos
        .filter(photo => photo.metadata.dateTime)
        .sort((a, b) => a.metadata.dateTime.getTime() - b.metadata.dateTime.getTime());
    if (photosWithDates.length === 0) {
        return [{
                name: 'Untitled Event',
                startDate: new Date(),
                endDate: new Date(),
                photos
            }];
    }
    const events = [];
    let currentEvent = null;
    for (const photo of photosWithDates) {
        const photoDate = photo.metadata.dateTime;
        if (!currentEvent) {
            // Start first event
            currentEvent = {
                name: generateEventName(photoDate),
                startDate: photoDate,
                endDate: photoDate,
                photos: [photo]
            };
        }
        else {
            const hoursDiff = (0, date_fns_1.differenceInHours)(photoDate, currentEvent.endDate);
            // If more than 6 hours gap or different day, start new event
            if (hoursDiff > 6 || !(0, date_fns_1.isSameDay)(photoDate, currentEvent.endDate)) {
                events.push(currentEvent);
                currentEvent = {
                    name: generateEventName(photoDate),
                    startDate: photoDate,
                    endDate: photoDate,
                    photos: [photo]
                };
            }
            else {
                // Add to current event
                currentEvent.photos.push(photo);
                currentEvent.endDate = photoDate;
            }
        }
    }
    if (currentEvent) {
        events.push(currentEvent);
    }
    // Add photos without dates to a separate event
    const photosWithoutDates = photos.filter(photo => !photo.metadata.dateTime);
    if (photosWithoutDates.length > 0) {
        events.push({
            name: 'Photos without date',
            startDate: new Date(),
            endDate: new Date(),
            photos: photosWithoutDates
        });
    }
    return events;
}
function generateEventName(date) {
    return (0, date_fns_1.format)(date, 'MMMM d, yyyy');
}
//# sourceMappingURL=eventSuggester.js.map