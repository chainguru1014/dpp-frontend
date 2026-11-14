import React from 'react';

// Lets the shell give a page's header a different title and a row of tabs
// without the page knowing: two pages shown as one menu item (Sustainability,
// Scans & Security, Shopper Preview) share one title, with tabs right under
// the header, as in the design. { title?, tabs?: [[page, label]], active, onChange }
const PageHeaderContext = React.createContext(null);
export default PageHeaderContext;
