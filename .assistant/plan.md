# Plan

Goal: A tip splitter: enter the bill, the tip percentage and the number of people, and see what each person pays. Round to the nearest cent.

1. The home page shows the calculator directly: labelled inputs for the bill amount, the tip percentage and the number of people, inside a form with a visible Calculate button, and it works when the page is opened by its plain URL with no sign-in or URL parameters.
2. While the bill, tip percentage and people count are entered, the page shows a live readout of the tip amount, the total including tip, and each person's share — every figure displayed to exactly two decimal places, rounded to the nearest cent (for example a $84.50 bill at 18% tip for 3 people shows $15.21 tip, $99.71 total and $33.24 each, using standard round-half-up). The per-person share is the largest figure on the result panel, with the tip amount and total shown smaller beneath it.
3. A quick-tip row of preset percentage buttons (at least 10%, 15%, 18%, 20%, 25%) sets the tip percentage in one tap, and the percentage can also be typed by hand, including decimals like 17.5%.
4. Entering a blank bill, a negative bill, a percentage below 0 or above 100, or a people count of 0 shows an inline error message naming the problem, computes no result, and the Save button saves nothing until the values are fixed.
5. The page shows a per-person breakdown table with one row per person: person number, their share of the tip and their total owed, so with 6 people entered there are 6 numbered rows. When the total does not divide evenly into whole cents (a $100.00 bill at 15% for 3 people is $115.00), the leftover cents are assigned to the earliest rows so the per-person totals sum exactly to the whole total.
6. Pressing Save split on the form stores the bill amount, tip percentage, number of people, tip amount, total and per-person share in the browser database, and after reloading the page the saved split is still listed.
7. The page shows a history of saved splits as a table listing the date, bill, tip %, people, total and per-person share for each saved entry, newest first — after saving four splits all four rows are listed — and each row has a Delete button that removes just that entry from the list and from storage.
8. When no splits have been saved yet the history area shows a plain message such as 'No saved splits yet' instead of an empty table.
9. A bar chart plots the saved splits' totals (one bar per saved split, labelled by date), built with the shipped themed chart component, and it renders from the saved data — with nothing saved the chart area shows the empty message rather than a broken chart, and after saving five splits the chart shows five bars.
10. Pressing the share button turns the current split result into an image and offers to share it, save it, or copy the link, with the outcome shown as text on the page; it only acts when pressed.
11. The calculator and the submit button can all be operated from the keyboard: typing values and pressing Enter on the form saves the split, and every control is reachable by tabbing.
12. At phone width the whole page is usable without horizontal scrolling and every custom control is at least 32px tall and wide.
13. app/config.ts declares per-person settings for the app title, the currency symbol, the default tip percentage and the quick-tip preset percentages; opening the app with settings in its link shows the chosen title, currency symbol, default tip and presets instead of the defaults, they are still there after a reload, and the plain address still shows the defaults.
14. The page title in the browser tab is the app's name from app/identity.ts, and the description there describes the tip splitter.

These are the outcomes this task is judged against.