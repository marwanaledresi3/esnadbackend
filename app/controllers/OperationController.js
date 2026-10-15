const { validationResult } = require('express-validator');
const OperationService = require('../services/OperationService');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');
class OperationController {
    static async create(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationError(res, errors.array());
            }

            const operation = await OperationService.createOperation(req.params.caseId, req.body, req.user);
            return apiResponse.success(res, 201, operation);
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const operation = await OperationService.getOperationById(req.params.id, req.user);
            return apiResponse.success(res, 200, operation);
        } catch (err) {
            next(err);
        }
    }

    static async getByCase(req, res, next) {
        try {
            const operations = await OperationService.getOperationsByCase(req.params.caseId, req.user);
            return apiResponse.success(res, 200, operations);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationError(res, errors.array());
            }

            const updated = await OperationService.updateOperation(req.params.id, req.body, req.user);
            return apiResponse.success(res, 200, updated);
        } catch (err) {
            next(err);
        }
    }
}
module.exports = OperationController;