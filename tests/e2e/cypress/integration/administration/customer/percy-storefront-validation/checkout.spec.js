import CheckoutPageObject from '../../../../support/pages/checkout.page-object';
import AccountPageObject from '../../../../support/pages/account.page-object';

let product = {};

// TODO See NEXT-6902: Use an own storefront project or make E2E tests independent from bundle
describe('Checkout: Visual tests', () => {
    beforeEach(() => {
        cy.setShippingMethodInSalesChannel('Standard').then(() => {
            return cy.createProductFixture();
        }).then(() => {
            return cy.fixture('product');
        })
            .then((result) => {
                product = result;
                return cy.createCustomerFixture();
            })
            .then(() => {
                cy.visit('/');
            });
    });

    it('@visual: check appearance of basic checkout workflow', () => {
        cy.window().then((win) => {
            const page = new CheckoutPageObject();
            const accountPage = new AccountPageObject();

            /** @deprecated tag:v6.5.0 - Use `CheckoutPageObject.elements.lineItem` instead */
            const lineItemSelector = win.features['v6.5.0.0'] ? '.line-item' : '.cart-item';

            cy.intercept({
                url: '/widgets/checkout/info',
                method: 'GET'
            }).as('cartInfo');

            // Take snapshot for visual testing on desktop
            cy.takeSnapshot('[Checkout] Search product',
                '.header-search-input',
                {widths: [375, 1920]});

            // Product detail
            cy.get('.header-search-input')
                .type(product.name);
            cy.contains('.search-suggest-product-name', product.name);
            cy.get('.search-suggest-product-name').click();

            // Take snapshot for visual testing
            cy.takeSnapshot('[Checkout] See product',
                '.product-detail-buy',
                {widths: [375, 1920]});

            cy.get('.product-detail-buy .btn-buy').click();

            // Off canvas
            cy.get('.offcanvas').should('be.visible');
            cy.contains(`${lineItemSelector}-price`, '49.98');
            cy.get('.offcanvas').should('be.visible');
            cy.contains('Continue shopping').should('be.visible');

            // close offcanvas again
            cy.contains('Continue shopping').click();
            // verify offcanvas is closed
            cy.get('.offcanvas').should('not.be.visible');

            // wait for cart info
            cy.wait('@cartInfo').its('response.statusCode').should('within', 200, 204);
            cy.get('.loader').should('not.exist');

            //  total should now be updated
            cy.get('.header-cart-total').scrollIntoView();
            cy.contains('.header-cart-total', '49.98');
            cy.get('.header-cart-total').click();
            cy.get('.offcanvas').should('be.visible');

            // Take snapshot for visual testing on desktop
            cy.takeSnapshot('[Checkout] Offcanvas',
                page.elements.offCanvasCart,
                { widths: [375, 1920] });

            cy.contains(`${lineItemSelector}-label`, product.name);

            // Checkout
            cy.get('.offcanvas-cart-actions .btn-primary').click();

            // Login
            cy.get('.checkout-main').should('be.visible');
            cy.get('.login-collapse-toggle').click();

            // Take snapshot for visual testing on desktop
            cy.takeSnapshot('[Checkout] Login', accountPage.elements.loginCard, {widths: [375, 1920]});

            cy.get('#loginMail').type('test@example.com');
            cy.get('#loginPassword').type('shopware');
            cy.get(`${accountPage.elements.loginSubmit} [type="submit"]`).click();

            // Confirm
            cy.contains('.confirm-tos .card-title', 'Terms and conditions and cancellation policy');

            // Take snapshot for visual testing on desktop
            cy.takeSnapshot('[Checkout] Confirm', '.confirm-tos', {widths: [375, 1920]});

            cy.get('.checkout-confirm-tos-label').scrollIntoView();
            cy.get('.checkout-confirm-tos-label').click(1, 1);
            cy.contains('.confirm-address', 'Pep Eroni');
            cy.contains(`${lineItemSelector}-details-container ${lineItemSelector}-label`, product.name);
            cy.contains(`${lineItemSelector}-total-price`, product.price[0].gross);
            cy.contains(`${lineItemSelector}-total-price`, product.price[0].gross);

            // Finish checkout
            cy.get('#confirmFormSubmit').scrollIntoView();
            cy.get('#confirmFormSubmit').click();

            // Take snapshot for visual testing on desktop
            cy.takeSnapshot('[Checkout] Finish', '.finish-header', {widths: [375, 1920]});
        });
    });
});
