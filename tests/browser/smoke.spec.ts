import {test,expect} from '@playwright/test';
test('public home, authenticated workspace, requirement draft, mobile layout and session revocation',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Better energy');
 await page.goto('/sign-in');await page.getByRole('button',{name:'Enter demo workspace'}).click();await expect(page).toHaveURL(/overview/);
 await page.getByRole('link',{name:'New requirement',exact:true}).click();
 await page.getByLabel('Requirement name').fill(`Browser smoke ${Date.now()}`);
 await page.getByLabel('Annual energy (MWh)').fill('1800');await page.getByLabel('Budget (LKR/kWh)').fill('31');await page.getByLabel('Delivery start date').fill('2035-01-01');
 await page.getByRole('button',{name:'Save requirement draft'}).click();await expect(page).toHaveURL(/requirements\/(?!new)/);await expect(page.getByText('Draft',{exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});await page.goto('/w/serendib/overview');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Sign out'}).click();await page.goto('/w/serendib/overview');await expect(page).toHaveURL(/sign-in/);
 expect((await page.request.get('/api/export')).status()).toBe(401);expect(errors).toEqual([]);
});
