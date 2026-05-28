// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

/// <reference types="cypress" />

context('Cycle active labels with keyboard shortcuts', () => {
    const taskName = 'Cycle labels shortcuts';
    const serverFiles = ['images/image_1.jpg'];

    const task = {
        name: taskName,
        project_id: null,
        source_storage: { location: 'local' },
        target_storage: { location: 'local' },
        labels: [
            { name: 'label 1', attributes: [], type: 'any' },
            { name: 'label 2', attributes: [], type: 'any' },
            { name: 'label 3', attributes: [], type: 'any' },
        ],
    };
    const storage = {
        server_files: serverFiles,
        image_quality: 70,
        use_zip_chunks: true,
        use_cache: true,
        sorting_method: 'lexicographical',
    };

    const rectanglePayload = {
        points: 'By 2 Points',
        type: 'Shape',
        labelName: 'label 1',
        firstX: 250,
        firstY: 350,
        secondX: 350,
        secondY: 450,
    };

    let taskId = null;
    let jobId = null;
    // The server may return labels in an arbitrary order, so the expected cycling
    // sequence is derived from the order rendered in the labels sidebar.
    const labelsOrder = [];

    before(() => {
        cy.visit('/auth/login');
        cy.login();
        cy.get('.cvat-tasks-page').should('exist').and('be.visible');
        cy.headlessCreateTask(task, storage).then((response) => {
            taskId = response.taskId;
            [jobId] = response.jobIds;
            cy.visit(`/tasks/${taskId}/jobs/${jobId}`);
            cy.get('.cvat-canvas-container').should('exist').and('be.visible');
        });
    });

    after(() => {
        cy.logout();
    });

    describe('Cycling labels with "]" and "["', () => {
        it('Collects the label order from the sidebar', () => {
            cy.get('.cvat-objects-sidebar-tabs').within(() => {
                cy.contains('[role="tab"]', 'Labels').click();
            });
            cy.get('.cvat-objects-sidebar-label-item .cvat-text').then(($items) => {
                $items.each((_, item) => {
                    labelsOrder.push(item.innerText);
                });
                expect(labelsOrder).to.have.length(3);
            });
            cy.get('.cvat-objects-sidebar-tabs').within(() => {
                cy.contains('[role="tab"]', 'Objects').click();
            });
        });

        it('Cycles the default label forward and wraps around when no object is activated', () => {
            // The default label starts at the first label of the job.
            cy.get('body').type(']');
            cy.contains(`Default label has been changed to "${labelsOrder[1]}"`).should('exist');
            cy.get('body').type(']');
            cy.contains(`Default label has been changed to "${labelsOrder[2]}"`).should('exist');
            // Wrap around back to the first label.
            cy.get('body').type(']');
            cy.contains(`Default label has been changed to "${labelsOrder[0]}"`).should('exist');
        });

        it('Cycles the default label backward and wraps around', () => {
            cy.get('body').type('[');
            cy.contains(`Default label has been changed to "${labelsOrder[2]}"`).should('exist');
            cy.get('body').type('[');
            cy.contains(`Default label has been changed to "${labelsOrder[1]}"`).should('exist');
        });

        it('Cycles the label of the activated object', () => {
            cy.createRectangle(rectanglePayload);
            cy.get('.cvat-canvas-container').click(300, 400);
            cy.get('#cvat_canvas_shape_1').should('have.class', 'cvat_canvas_shape_activated');
            cy.get('#cvat-objects-sidebar-state-item-1')
                .find('.cvat-objects-sidebar-state-item-label-selector')
                .should('have.text', labelsOrder[0]);

            cy.get('body').type(']');
            cy.get('#cvat-objects-sidebar-state-item-1')
                .find('.cvat-objects-sidebar-state-item-label-selector')
                .should('have.text', labelsOrder[1]);

            cy.get('body').type('[');
            cy.get('#cvat-objects-sidebar-state-item-1')
                .find('.cvat-objects-sidebar-state-item-label-selector')
                .should('have.text', labelsOrder[0]);
        });
    });

    describe('Opening shortcut settings with "F3"', () => {
        it('F3 opens the settings dialog directly on the Shortcuts tab', () => {
            cy.realPress(['F3']);
            cy.get('.cvat-settings-modal').should('be.visible');
            cy.get('.cvat-settings-tabs .ant-tabs-tab-active').should('contain.text', 'Shortcuts');
            cy.get('.cvat-shortcuts-settings-collapse').should('exist').and('be.visible');
            cy.closeSettings();
        });
    });
});
