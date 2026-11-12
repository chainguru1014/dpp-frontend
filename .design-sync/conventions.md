# Yometel DPP Admin — how to build with it

The Yometel Digital Product Passport admin site (companies, supervisors and
staff manage products, codes, brands and users). React 18 + **MUI v5** with
one custom theme. Style with MUI props and the `sx` prop using theme tokens;
there are no utility classes and no CSS files of our own.

## 1. Wrap the design once in `YometelAdminProvider`

It applies the Yometel MUI theme and CSS baseline, a router context, and the
global toast / confirm dialog. Without it everything renders in default MUI
blue with Roboto, and `notify()` shows nothing.

```jsx
const { YometelAdminProvider, PageHeader, Button, Icons, notify } = window.YometelDppAdmin;
<YometelAdminProvider>…page…</YometelAdminProvider>
```

Feedback goes through `notify(message, 'success'|'info'|'warning'|'error')` and
`await confirmAction({ title, message, confirmText, danger })`, never
`window.alert` / `confirm`.

## 2. Styling vocabulary (theme tokens)

- Palette: `primary.main` #1b4f72 (navy), `primary.dark` #123a56, `primary.light`
  #4a96dd (azure), `secondary.main` #51617a, `background.default` #f5f7fa (page),
  `background.paper` #fff, `text.primary` #16324a, `text.secondary` #51617a,
  `divider` #dfe5ec, plus `success` / `error` / `warning` / `info`.
  Use them as strings: `sx={{ bgcolor: 'background.default', color: 'primary.main' }}`.
- Type: Poppins; body 17px. Use `Typography` variants `h4`, `h5` (page titles),
  `h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `caption`, `overline`.
- Shape: `theme.shape.borderRadius` 12; Cards 16. Spacing is the MUI 8px scale
  (`p: 3` = 24px).
- Buttons: `variant="contained"` is the primary action (azure→navy gradient,
  no caps; `color="error"` / `"success"` get red / green gradients for
  destructive / confirm); `variant="outlined"` secondary; text buttons tertiary.
  Controls are 48px tall (a little denser on laptop screens with a mouse).
  Dialog titles carry the azure→navy gradient.
- Icons: `Icons.<Name>` (the MUI icons the site uses: `Icons.Add`, `Icons.Edit`,
  `Icons.Delete`, `Icons.Visibility`, `Icons.Inventory2`, `Icons.QrCode2`,
  `Icons.Dashboard`, `Icons.People`, `Icons.Business`, `Icons.Settings`,
  `Icons.History`, `Icons.Close`, `Icons.ContentCopy`…) and `RfidIcon`.
- MUI parts are exported on the same global, already themed: `Box`, `Stack`,
  `Grid`, `Container`, `Typography`, `Button`, `IconButton`, `TextField`, `Select`,
  `MenuItem`, `Card`, `CardContent`, `Paper`, `Chip`, `Avatar`, `Dialog`
  (+ `DialogTitle` / `DialogContent` / `DialogActions`), `Tabs` / `Tab`, `Table`
  (+ `TableHead` / `TableBody` / `TableRow` / `TableCell` / `TableContainer`), `Alert`,
  `Switch`, `Checkbox`, `Tooltip`, `List*`, `AppBar`, `Toolbar`, `Drawer`.

## 3. Page pattern

Every admin page is: `PageHeader` (icon, title, one-line description, primary
action on the right, extra actions in `moreActions`), then content in `Card`s on
the `background.default` page. Keep pages short and large; one main action
per page. `PageHelp page="products"` adds the "?" help next to a title.

## 4. Where to look

Each component's `components/<group>/<Name>/<Name>.prompt.md` has props and
examples, and `<Name>.d.ts` is the contract. Product data:
`{ _id, name, model, images: [url…], brandInfo: { name }, detailFacts, maintenance: { iconIds }, … }`
(see the DppPhoneView card). `DppPhoneView` / `PreviewModal` show the shopper's passport in a phone frame.

## Example: a products page

```jsx
const { YometelAdminProvider, PageHeader, Box, Card, CardContent, Typography, Button, Chip, Stack, Icons } = window.YometelDppAdmin;
<YometelAdminProvider>
  <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
    <PageHeader icon={Icons.Inventory2} title="Products"
      description="Every product your company has registered."
      actions={<Button variant="contained" startIcon={<Icons.Add />}>New product</Button>} />
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="subtitle1" sx={{ flex: 1 }}>Shirt Jacket</Typography>
          <Chip label="Active" color="success" />
          <Button variant="outlined" startIcon={<Icons.Visibility />}>Preview</Button>
        </Stack>
      </CardContent>
    </Card>
  </Box>
</YometelAdminProvider>
```
